import { contentMetadata, ContentAttributes, type Content as ContentInterface } from "../entities/Content";

import type { Guid, User, Resource, CdsResponse, Attachment, Content } from "../types/index";

import BatchRequest, { HTTPMethod } from "./BatchRequest";

import { filetype, resourcetype } from "../enums";

export default class CdsService {
  public static readonly serviceName = "CdsService";
  public readonly ClientUrl: string = "http://localhost:8000";
  private readonly apiUrl: string = "http://localhost:8000/api/data/v9.2";
  private readonly apiRoute: string = "/api/data/v9.2";

  private groupResrourceAlias = "groupresourceid";
  private resourceAlias = "resourceid";

  public async Register(username: string, email: string, password: string): Promise<CdsResponse<User>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        const user: User = {
          ...data.user,
          token: data.token,
          isAuthenticated: true,
        };
        return { data: user };
      } else {
        // Handle and display error messages dynamically for all fields
        const errorMessages = Object.keys(data).map((field) => {
          return `${data[field].join(", ")}`;
        });
        return {
          error: Error(
            (errorMessages.length > 0 && errorMessages.join(" | ")) || "Error registering the user: Response is not ok"
          ),
        };
      }
    } catch (error: any) {
      console.error("Error registering the user:", error);
      return { error: Error("Error registering the user") };
    }
  }

  public async Login(username: string, password: string): Promise<CdsResponse<User>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        const user: User = {
          ...data.user,
          token: data.token,
          isAuthenticated: true,
        };
        return { data: user };
      } else {
        return { error: Error(data.message || "Error logging in: Response is not ok") };
      }
    } catch (error: any) {
      console.error("Error logging in:", error);
      return { error: Error("Error logging in") };
    }
  }

  public async Logout(token: string): Promise<CdsResponse<void>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/logout`, {
        method: "POST",
        credentials: "include", // Send cookies for session management
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // Attach the token in the Authorization header
        },
      });
      const data = await response.json();
      if (response.ok) {
        return { data: undefined };
      } else {
        return {
          error: Error((data.detail && `Logout failed: ${data.detail}`) || "Error logging out: Response is not ok"),
        };
      }
    } catch (error: any) {
      console.error("Error logging out:", error);
      return { error: Error("Error logging out") };
    }
  }

  public async CheckAuthStatus(token: string): Promise<CdsResponse<User>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth-status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // Attach the token in the Authorization header
        },
      });
      const data = await response.json();
      if (response.ok) {
        const user: User = {
          ...data.user,
          token: data.token,
          isAuthenticated: true,
        };
        return { data: user };
      } else {
        return { error: Error("Unable to check authentication status, Token invalid or expired") };
      }
    } catch (error: any) {
      console.error("Error checking authentication:", error);
      return { error: Error("Error checking authentication") };
    }
  }

  public async Follow(
    token: string,
    username: string
  ): Promise<CdsResponse<{ username: string; isFollowee: boolean }>> {
    try {
      const res = await fetch(`${this.apiUrl}/api/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // Attach the token in the Authorization header
        },
        body: JSON.stringify({
          username,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { data: data.followee };
      } else {
        const data = await res.json();
        return { error: Error(data.message) };
      }
    } catch (error: any) {
      console.error("Error follow user (${username}):", error);
      return { error: Error("Error follow user (${username})") };
    }
  }

  public async fetchSubjectResources(subjectGuid: string): Promise<CdsResponse<Record<string, Resource>>> {
    try {
      //TODO
      // get fetchXml for group resources and subject resources
      const groupResourcesFetchXml = "this.groupResourcesFetchXml(subjectGuid)";
      // make a batch request to get group resources and subject resources
      const resourcesBatchRequest = new BatchRequest(this.ClientUrl);
      resourcesBatchRequest.addOperation(
        HTTPMethod.GET,
        `${this.apiUrl}/resourcegroups?fetchXml=${encodeURIComponent(groupResourcesFetchXml)}`
      );
      const resourcesBatchData = await resourcesBatchRequest.execute();
      const groupResources = resourcesBatchData[0].body.value;
      // check if there are no resources
      if (!groupResources || !groupResources.length) return { data: {} };
      // format the resources
      const resources = this.formatGroupResources(groupResources, subjectGuid);
      // make a batch request to get the content for the resources
      const batchRequest = new BatchRequest(this.ClientUrl);
      for (const resource of Object.values(resources))
        if (!resource.blobUrl) batchRequest.addOperation(HTTPMethod.GET, resource.url);
      const res = await batchRequest.execute();
      // format the result and create a blob url for each resource
      res.forEach((response) => {
        const fileContent: string = response.body;
        const headers = response.headers;
        let fileName: string = headers["x-ms-file-name"];
        let mimeType = headers["mimetype"];
        if (mimeType === "text/plain") {
          mimeType = "application/javascript";
        }
        const resource = resources[fileName];
        if (!resource) return;
        // make a url for the file as a blob object, use the file name as the key
        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        resource.blobUrl = url;
        resources[fileName] = resource;
      });
      if (!this.allKeysHaveValues(resources)) return { error: Error("Some or all resources are invaild") };
      return { data: resources };
    } catch (error: any) {
      console.error("Error in fetchSubjectResources:", error);
      return { error: Error("An unexpected error occurred.") };
    }
  }

  private formatGroupResources(data: { [key: string]: any }[], subjectGuid: string): Record<string, Resource> {
    const resources: Record<string, Resource> = {};
    for (const entity of data) {
      const resourceGuid: Guid = entity[`${this.resourceAlias}.ResourceId`];
      if (!resourceGuid) continue;
      const title: string = entity[`${this.resourceAlias}.Title`];
      let fileName: string = entity[`${this.resourceAlias}.File_Name`];
      const type: resourcetype = entity[`${this.resourceAlias}.Type`];
      const order = entity[`${this.groupResrourceAlias}.Order}`];
      const resourceFileUrl = `${this.apiUrl}/resources(${resourceGuid})/File/$value`;
      const resource: Resource = {
        guid: resourceGuid,
        subjectGuid,
        fileName,
        title,
        type,
        order,
        url: resourceFileUrl,
      };
      resources[fileName] = resource;
    }
    return resources;
  }

  /**
   * Fetches the content tree from the MDA.
   */
  public async fetchTree(
    courseCategoryGuid: string
  ): Promise<{ content: Content; error?: never } | { content?: never; error: Error }> {
    const apiUrl = `${this.apiUrl}/axa_GetContentTreeByCourseCategoryId`;
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ CourseCategoryId: courseCategoryGuid }),
    };
    const response = await fetch(apiUrl, requestOptions);
    if (!response.ok) return { error: Error(`Error: ${response.status} - ${response.statusText}`) };
    const data = await response.json();
    // Extract the relevant data
    const contentTree = JSON.parse(data.ContentTree); // Convert ContentTree string to JSON
    if (!Array.isArray(contentTree)) return { error: Error("ContentTree is not an array") };
    if (!(contentTree.length > 0)) return { error: Error("ContentTree array is empty") };
    // Format the content tree and store it
    const formattedData = this.formatTree(contentTree[0]); // Assuming a single root
    // TODO: Remove if not needed (Note: it doesn't work)
    // /** batch-count and annotate flags using BatchRequest */
    // // Flatten all nodes into a single array so we can query counts in bulk
    // const allNodes: Content[] = [];
    // const collect = (node: Content) => {
    //   allNodes.push(node);
    //   // Recursively collect child nodes
    //   node.children?.forEach((child) => collect(child));
    // };
    // collect(formattedData);
    // if (allNodes.length > 0) {
    //   // Build comma-separated list of IDs for use in the OData `in` filter
    //   const idList = allNodes.map((nodes) => `'${nodes.id}'`).join(",");
    //   // Build OData aggregation query strings to count records grouped by content ID
    //   const questionQuery = [
    //     `${axa_questionMetadata.collectionName}`,
    //     `?$apply=filter(`,
    //     `    ${this.toGuidField(axa_contentMetadata.logicalName)} in (${idList})`,
    //     `)`,
    //     `/groupby(`,
    //     `    (${this.toGuidField(axa_contentMetadata.logicalName)}),`,
    //     `    aggregate($count as count)`,
    //     `)`,
    //   ]
    //     .map((line) => line.trim())
    //     .join("");
    //   const examRuleQuery = [
    //     `${axa_examtemplateruleMetadata.collectionName}`,
    //     `?$apply=filter(`,
    //     `    ${this.toGuidField(axa_contentMetadata.logicalName)} in (${idList})`,
    //     `)`,
    //     `/groupby(`,
    //     `    (${this.toGuidField(axa_contentMetadata.logicalName)}),`,
    //     `    aggregate($count as count)`,
    //     `)`,
    //   ]
    //     .map((line) => line.trim())
    //     .join("");
    //   // Initialize a single BatchRequest to execute both queries in one HTTP call
    //   const batch = new BatchRequest(this.clientUrl);
    //   // Add GET operation for questions count
    //   batch.addOperation(HTTPMethod.GET, `${this.apiRoute}/${questionQuery}`);
    //   // Add GET operation for exam template rules count
    //   batch.addOperation(HTTPMethod.GET, `${this.apiRoute}/${examRuleQuery}`);
    //   const responses = await batch.execute();
    //   // Extract and map results
    //   // Parse batch responses and create lookup maps of boolean flags
    //   const qBody = (responses[0].body as any).value as { _axa_content_value: string; count: number }[];
    //   const rBody = (responses[1].body as any).value as { _axa_content_value: string; count: number }[];
    //   // Map of content ID to whether it has any related Questions
    //   const qMap = new Map(qBody.map((e) => [e._axa_content_value, e.count > 0]));
    //   // Map of content ID to whether it has any related ExamTemplateRules
    //   const rMap = new Map(rBody.map((e) => [e._axa_content_value, e.count > 0]));
    //   // Annotate each node with the flags based on lookup maps
    //   allNodes.forEach((node) => {
    //     node.hasQuestions = qMap.get(node.id) || false;
    //     node.hasExamTemplateRules = rMap.get(node.id) || false;
    //   });
    // }
    // /** end batch-count and annotate --- */
    return { content: formattedData };
  }

  /**
   * Recursively formats the content tree node.
   * @param node The current node to format.
   * @param parent The parent node, if any.
   * @returns The formatted content node.
   */
  private formatTree = (node: any, parent: Content | null = null): Content => {
    const parentOfChild: Content = {
      id: node.ContentId,
      name: node.Name,
      order: node.Order,
      parentId: node.ParentId,
      path: node.Path,
      referenceID: node.ReferenceID,
      treeLevel: node.TreeLevel,
      parent: parent ? parent : undefined,
    };
    const formattedNode: Content = {
      ...parentOfChild,
      // Recurse into children and sort by Order
      children:
        node.Children.map((child: Content) => this.formatTree(child, parentOfChild)).sort(
          (a: Content, b: Content) => a.order - b.order
        ) ?? [],
    };
    return formattedNode;
  };

  // TODO: make this a batch request, this is unbelievably slow
  public async fetchContent(content: Content, includeChildren: boolean): Promise<CdsResponse<string | undefined>> {
    let allContent: string = "";
    let page = 1;
    let totalPages = 1;
    // Keep fetching until all pages are retrieved
    while (page <= totalPages) {
      const response = await this.fetchContentPage(content.id, includeChildren, page);
      if (response instanceof Error) return { error: response };
      allContent += response.ContentFile;
      totalPages = response.TotalPages;
      page++;
    }
    if (!allContent || allContent === "undefined") return { data: undefined };
    return { data: allContent };
  }

  private fetchContentPage = async (
    contentId: string,
    includeChildren: boolean,
    page: number
  ): Promise<any | Error> => {
    const apiUrl = `${this.apiUrl}/axa_GetContentFileByContentId`;
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        ContentId: contentId,
        IncludeChildren: includeChildren,
        Page: page,
        PageSize: 100000,
      }),
    };
    const response = await fetch(apiUrl, requestOptions);
    if (!response.ok && response.status !== 404)
      return new Error(`Page ${page} - Error${response.status} - ${response.statusText}`);
    const data = await response.json();
    return data;
  };

  public async setContentFile(content: Content, htmlString: string, fileName: string): Promise<CdsResponse> {
    try {
      const array = new TextEncoder().encode(htmlString);
      const url = `${this.apiUrl}/${contentMetadata.collectionName}(${content.id})/ContentFile?x-ms-file-name=${fileName}`;
      let makeRequestRes = await this.makeRequest({ method: "PATCH", fileName, url, bytes: null, firstRequest: true });
      if (makeRequestRes.error) return makeRequestRes;
      let [uploadRes] = await Promise.all([
        this.fileChunckUpload({ response: makeRequestRes.data, fileName: fileName, fileBytes: array }),
        // im updating the path here just to make sure we have the right path of the content, since it's normally filled with our import api (i dont trust it)
        //TODO
        // this.Context.webAPI.updateRecord(contentMetadata.logicalName, content.id, {
        //   [ContentAttributes.axa_Path]: content.path,
        // }),
      ]);
      if (uploadRes.error) return { error: new Error("Error uploading file") };
      else return { data: undefined };
    } catch (e: any) {
      return { error: new Error(e.message) };
    }
  }

  public async fetchAttachments(contentGuid: string): Promise<CdsResponse<Attachment[]>> {
    try {
      const data: any = {};
      let attachments: Attachment[] = [];
      data.entities.map((entity: any) => {
        const contentAttachmentGuid: Guid = entity[`ContentAttachmentId`];
        const fileName: string = entity[`File_Name`];
        const baseUrl = `${this.apiRoute}/contentattachments(${contentAttachmentGuid})/File`;
        const path = entity[`path`];
        const url: string = baseUrl + "/$value";
        const type: filetype = entity[`Type`];
        const attachment: Attachment = {
          guid: contentAttachmentGuid,
          fileName,
          path,
          url,
          type,
        };
        attachments.push(attachment);
      });
      return { data: attachments };
    } catch (e: any) {
      e.message = `Error fetching attachments: ${e.message}`;
      return { error: e };
    }
  }

  public async uploadContentAttachment(content: Content, file: File): Promise<CdsResponse<Attachment>> {
    if (!content.path) return { error: new Error("Content path is not set") };
    try {
      const type: filetype | undefined = file.type.startsWith("image/")
        ? filetype.Image
        : file.type.startsWith("video/")
        ? filetype.Video
        : file.type.startsWith("audio/")
        ? filetype.Audio
        : file.type === "application/zip" || file.type === "application/x-zip-compressed"
        ? filetype.InteractiveModel
        : undefined; //TODO: not too sure about 3d model, recheck when implemented
      if (!type) return { error: new Error(`Unsupported file type: ${file.type}`) };
      const path = this.getAttachmentPath(type, file.name, content.path);
      //TODO
      const createRecordRes: any = {};
      const contentAttachementGuid: Guid = createRecordRes.id;
      const fileName = file.name;
      const baseUrl = `${this.apiRoute}/contentattachments(${contentAttachementGuid})/File`;
      const url = baseUrl + `?x-ms-file-name=${fileName}`;
      const array = await this.fileToUint8Array(file);
      let makeRequestRes = await this.makeRequest({ method: "PATCH", fileName, url, bytes: null, firstRequest: true });
      if (makeRequestRes.error) return { error: makeRequestRes.error };
      let uploadRes = await this.fileChunckUpload({
        response: makeRequestRes.data,
        fileName: fileName,
        fileBytes: array,
      });
      if (uploadRes.error) {
        this.deleteAttachment(contentAttachementGuid);
        return { error: new Error("Error uploading file") };
      }
      const attachment: Attachment = {
        guid: createRecordRes.id,
        fileName: file.name,
        path,
        url: baseUrl + "/$value",
        type: type,
      };
      return { data: attachment };
    } catch (e: any) {
      return { error: new Error(e.message) };
    }
  }

  public async deleteAttachment(contentAttachementGuid: Guid): Promise<
    CdsResponse<{
      id: string;
      name?: string | undefined;
      entityType: string;
    }>
  > {
    try {
      const response = { id: "", entityType: "", name: undefined };
      if (response instanceof Error || !response) return { error: new Error("No response from the API") };
      return { data: response };
    } catch (e: any) {
      return { error: new Error(e.message) };
    }
  }

  private makeRequest = async ({
    method,
    fileName,
    url,
    bytes,
    firstRequest,
    offset,
    count,
    fileBytes,
  }: {
    method: string;
    fileName: string;
    url: string;
    bytes: Uint8Array | null;
    firstRequest: boolean;
    offset?: number;
    count?: number;
    fileBytes?: Uint8Array;
  }): Promise<CdsResponse<XMLHttpRequest>> => {
    return new Promise(function (resolve, reject) {
      const request = new XMLHttpRequest();
      request.open(method, url);
      request.setRequestHeader("OData-Version", "4.0");
      request.setRequestHeader("OData-MaxVersion", "4.0");
      request.setRequestHeader("Accept", "application/json");
      if (firstRequest) request.setRequestHeader("x-ms-transfer-mode", "chunked");
      if (!firstRequest) {
        request.setRequestHeader("x-ms-file-name", fileName);
        request.setRequestHeader("Content-Type", "application/octet-stream");
        request.setRequestHeader(
          "Content-Range",
          `bytes ${offset}-${(offset ?? 0) + (count ?? 0) - 1}/${fileBytes?.length}`
        );
        // request.setRequestHeader("Content-Length", `${count ?? 0}`);
      }
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) resolve({ data: request });
        else reject({ error: new Error(request.statusText) });
      };
      request.onerror = () => reject({ error: new Error(request.statusText) });
      //TODO
      if (!firstRequest) request.send(bytes);
      else request.send();
    });
  };

  private fileChunckUpload = async ({
    response,
    fileName,
    fileBytes,
  }: {
    response: XMLHttpRequest;
    fileName: string;
    fileBytes: Uint8Array;
  }): Promise<CdsResponse> => {
    const url = response.getResponseHeader("location") || "";
    const chunkSize = parseInt(response.getResponseHeader("x-ms-chunk-size") || "");
    let offset = 0;
    try {
      while (offset <= fileBytes.length) {
        const count = offset + chunkSize > fileBytes.length ? fileBytes.length % chunkSize : chunkSize;
        const content = new Uint8Array(count);
        for (let i = 0; i < count; i++) content[i] = fileBytes[offset + i];
        const res = await this.makeRequest({
          method: "PATCH",
          fileName,
          url,
          bytes: content,
          firstRequest: false,
          offset,
          count,
          fileBytes,
        });
        if (res.error) {
          return { error: new Error("error happened") };
        }
        response = res.data;
        if (response.status === 206)
          // partial content, so please continue.
          offset += chunkSize;
        else if (response.status === 204)
          // request complete.
          return { data: undefined };
        else {
          // error happened. log error and take necessary action.
          console.error("error happened");
          return { error: new Error("error happened" + response.status) };
        }
      }
    } catch (e: any) {
      return { error: new Error(e.message) };
    }
    return { data: undefined };
  };

  /**
   * Create a new content node in Dataverse
   */
  public async CreateContentNode(node: Content, subjectGuid: Guid): Promise<CdsResponse<{ id: Guid }>> {
    try {
      // Build the payload for the content node.
      const payload: Partial<ContentInterface> = {};
      // If the node has a reference ID, include it in the payload.
      if (node.referenceID) payload[ContentAttributes.ReferenceID] = node.referenceID;
      // If the node has a parent, set up the lookup binding.
      //TODO
      // if (node.parent)
      //   payload[this.toLookupField(ContentAttributes.Parent)] = `/${contentMetadata.collectionName}(${node.parent.id})`;
      const response = await fetch(`${this.apiUrl}/${contentMetadata.collectionName}`, {
        method: "POST",
        headers: {
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw data.error ?? new Error("Failed to create content node");
      return { data: { id: data[contentMetadata.primaryIdAttribute] } };
    } catch (error: any) {
      return { error };
    }
  }

  /**
   * Update an existing content node in Dataverse
   */
  public async UpdateContentNode(node: Content): Promise<CdsResponse<void>> {
    try {
      const data: Partial<ContentInterface> = { [ContentAttributes.Name]: node.name };
      // If the node has a reference ID, include it in the data payload.
      if (node.referenceID) data[ContentAttributes.ReferenceID] = node.referenceID;
      //TODO await this.Context.webAPI.updateRecord(contentMetadata.logicalName, node.id, data);
      return { data: undefined };
    } catch (error: any) {
      return { error };
    }
  }

  /**
   * Delete a content node from Dataverse
   */
  public async DeleteContentNode(node: Content): Promise<CdsResponse<void>> {
    try {
      // Initialize BatchRequest with the Organization URL
      const batchRequest = new BatchRequest(this.ClientUrl);
      /**
       * Recursively processes a content node by adding a corresponding detete (DELETE)
       * operation to the batch request. Also processes any child nodes.
       *
       * @param content - The current content node being processed.
       */
      const processNode = (content: Content) => {
        // Add DELETE operation (delete) for the node.
        batchRequest.addOperation(
          HTTPMethod.DELETE,
          `${this.apiRoute}/${contentMetadata.collectionName}(${content.id})`,
          {},
          {},
          true // Include in changeset
        );
        // Recursively process all child nodes.
        if (content.children && content.children.length > 0) {
          content.children.forEach((child) => processNode(child));
        }
      };
      // Step 1: Prepare batch operations by processing the content node to delete.
      processNode(node);
      // Step 2: Execute the batch request and process the response.
      try {
        const res: any[] = await batchRequest.execute();
        return { data: undefined }; // No errors, resequencing is successful
      } catch (error: any) {
        throw new Error(`Batch Request Error: ${error.message}`);
      }
    } catch (error: any) {
      return { error };
    }
  }

  // TODO: Maybe needs to be improved to expect only the resequneced Content objects (not all the Content including the not resequenced!)
  /**
   * Saves the content sequence (the entire branch of new and updated nodes) in a single BatchRequest.
   * This method recursively traverses the content trees (or branches) to be saved and:
   *  - For existing nodes, it adds a PATCH operation to update changes (order, path, parent, etc.).
   * Parent references for new nodes are set using OData content-ID references if the parent is also new.
   *
   * @param newContent - An array of root content nodes (branches) to be saved.
   * @param subjectGuid - The Guid of the Subject to which these Content nodes belong.
   * @returns A promise resolving to a CdsResponse containing the updated content trees.
   */
  public async SaveContentSequence(newContent: Content[]): Promise<CdsResponse<Content[]>> {
    // Initialize BatchRequest with the Organization URL
    const batchRequest = new BatchRequest(this.ClientUrl);
    // Mapping of temporary node IDs (e.g. "new123456") to the assigned batch Content-ID.
    const newIdMapping: Record<string, number> = {};
    /**
     * Recursively processes a content node by adding a corresponding create (POST) or update (PATCH)
     * operation to the batch request. Also processes any and child nodes.
     *
     * @param content - The current content node being processed.
     */
    const processNode = (content: Content) => {
      // Build payload with updated fields.
      const payload: Partial<ContentInterface> = {
        [ContentAttributes.Order]: content.order,
        [ContentAttributes.Path]: content.path,
      };
      //TODO
      // // If the node has a parent, reference the parent's persisted ID.
      // if (content.parent) {
      //   payload[
      //     this.toLookupField(ContentAttributes.Parent)
      //   ] = `/${contentMetadata.collectionName}(${content.parent.id})`;
      // }
      // Add PATCH operation (update) for the existing node.
      batchRequest.addOperation(
        HTTPMethod.PATCH,
        `${this.apiRoute}/${contentMetadata.collectionName}(${content.id})`,
        payload,
        {
          "Content-Type": "application/json",
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
          "If-Match": "*",
        },
        true // Include in changeset
      );
      // Recursively process all child nodes.
      if (content.children && content.children.length > 0) {
        content.children.forEach((child) => processNode(child));
      }
    };
    // Step 1: Prepare batch operations by processing each content tree (branch).
    newContent.forEach((content) => {
      processNode(content);
    });
    // Step 2: Execute the batch request and process the response.
    try {
      const res: any[] = await batchRequest.execute();
      return { data: res }; // No errors, resequencing is successful
    } catch (error: any) {
      console.error("Batch Request Error:", error);
      return { error: error };
    }
  }

  /**
   * Recursively searches for a node with the given temporary ID in the content tree and updates it with the new ID.
   * @param tempId - The temporary node ID (e.g. "new12345").
   * @param newId - The actual Dataverse-assigned ID.
   * @param node - The current node in the tree.
   * @returns true if the node was found and updated, false otherwise.
   */
  private updateNodeId(tempId: string, newId: string, node: Content): boolean {
    if (node.id === tempId) {
      node.id = newId;
      return true;
    }
    if (node.children && node.children.length > 0) {
      for (let child of node.children) {
        if (this.updateNodeId(tempId, newId, child)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper function to encode xml
  private xmlEncode(input: string): string {
    return input
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  public toGuidField(value: string): string {
    return `_${value}_value`;
  }

  public toLookupField(value: string): string {
    return `${this.capitalizeAfterUnderscore(value)}@odata.bind`;
  }

  public toFormattedValue(value: string): string {
    return `${value}@OData.Community.Display.V1.FormattedValue`;
  }

  public toEntityType(value: string): string {
    return `${value}@Microsoft.Dynamics.CRM.lookuplogicalname`;
  }

  public capitalizeAfterUnderscore(input: string): string {
    return input.replace(/_(\w)/, (_, firstChar) => `_${firstChar.toUpperCase()}`);
  }

  public fileToUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      // Event listener for successful read
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject(new Error("Unexpected result type from FileReader."));
        }
      };
      // Event listener for errors
      reader.onerror = () => {
        reject(reader.error);
      };
      // Read file as ArrayBuffer
      reader.readAsArrayBuffer(file);
    });
  }

  public allKeysHaveValues<T>(record: Record<string, T>): boolean {
    return Object.values(record).every((value) => value !== undefined && value !== null);
  }

  private getAttachmentPath = (type: filetype, fileName: string, contentPath: string): string => {
    const path = contentPath.split("\\");
    // eg L0O0\L1O1\Images\image.png
    // Level 1 path
    const level1PathIndex = path.findIndex((p) => p.includes("L1"));
    const level1Path = path.slice(0, level1PathIndex + 1).join("\\");
    let attachmentPath = "";
    switch (type) {
      case filetype.Image:
        attachmentPath = `${level1Path}\\images`;
        break;
      case filetype.Video:
        attachmentPath = `${level1Path}\\videos`;
        break;
      case filetype.Audio:
        attachmentPath = `${level1Path}\\sounds`;
        break;
      case filetype.InteractiveModel:
        attachmentPath = `${level1Path}\\attachments`;
        break;
      default:
        break;
    }
    return `${attachmentPath}\\${fileName}`;
  };

  /**
   * Checks whether the current user has both WRITE and APPEND/APPEND‑TO privileges
   * for the specified custom entities.
   *
   * This method invokes the RetrieveUserSetOfPrivilegesByNames function in the Web API
   * to fetch the user's global privilege set for both write and append operations
   * on axa_Content, axa_ContentAttachment, axa_CourseCategory, and axa_LearningObjective.
   * It returns true only if the user possesses *all* of the required privileges.
   *
   * @async
   * @function
   * @returns {Promise<CdsResponse<boolean>>}
   *   A promise that resolves to a CdsResponse containing:
   *   - .data: `true` if the user has all required WRITE, APPEND, and APPEND‑TO privileges;
   *   - .error: an Error if the HTTP request failed or the response could not be parsed.
   */
  public async checkUserPrivileges(): Promise<CdsResponse<boolean>> {
    try {
      // Get the current user's GUID without curly braces
      const userId = ""; //TODO Xrm.Utility.getGlobalContext().userSettings.userId.replace("{", "").replace("}", "");
      // Define the privileges to check
      const requiredPrivileges = [
        // WRITE
        "prvWriteaxa_Content",
        "prvWriteaxa_ContentAttachment",
        "prvWriteaxa_CourseCategory",
        "prvWriteaxa_LearningObjective",
        // APPEND
        "prvAppendaxa_Content",
        "prvAppendaxa_ContentAttachment",
        "prvAppendaxa_CourseCategory",
        "prvAppendaxa_LearningObjective",
        // APPEND TO
        "prvAppendToaxa_Content",
        "prvAppendToaxa_ContentAttachment",
        "prvAppendToaxa_CourseCategory",
        "prvAppendToaxa_LearningObjective",
      ];
      // Build an OData literal for a collection of strings (quote‑and‑comma‑join)
      const privilegesParam: string = requiredPrivileges.map((p) => `'${p}'`).join(","); // This produces a string
      // Construct the URL using the documented syntax.
      const url = `${this.ClientUrl}/api/data/v9.2/systemusers(${userId})/Microsoft.Dynamics.CRM.RetrieveUserSetOfPrivilegesByNames(PrivilegeNames=@p)?@p=[${privilegesParam}]`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        return { error: new Error(`Error fetching privileges: ${response.status} - ${response.statusText}`) };
      }
      const data = await response.json();
      // Extract the 'RolePrivileges' array from the response
      const userPrivileges = data.RolePrivileges.map((priv: { PrivilegeName: string }) => priv.PrivilegeName);
      // Check if the user has all the required privileges
      const hasPrivileges = requiredPrivileges.every((privilege) => userPrivileges.includes(privilege));
      return { data: hasPrivileges };
    } catch (error: any) {
      return { error: new Error(error.message) };
    }
  }
}
