import { ContentAttributes, type Content as ContentInterface } from "../entities/Content";

import type { Guid, User, Resource, CdsResponse, Attachment, Content, Doc } from "../types/index";

import BatchRequest, { HTTPMethod } from "./BatchRequest";

import { filetype } from "../enums";

export default class CdsService {
  public static readonly serviceName = "CdsService";
  public readonly ClientUrl: string = "http://localhost:8000";
  private readonly apiUrl: string = "http://localhost:8000/api";
  private readonly apiRoute: string = "/api";

  public async Register(username: string, email: string, password: string): Promise<CdsResponse<User>> {
    try {
      const response = await fetch(`${this.ClientUrl}/api/register`, {
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
      const response = await fetch(`${this.ClientUrl}/api/login`, {
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
      const response = await fetch(`${this.ClientUrl}/api/logout`, {
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
      const response = await fetch(`${this.ClientUrl}/api/auth-status`, {
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
      const res = await fetch(`${this.ClientUrl}/api/follow`, {
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

  /**
   * Fetch documents of current user
   */
  public async FetchDocuments(token: string): Promise<CdsResponse<Doc[]>> {
    try {
      const response = await fetch(`${this.apiUrl}/documents`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // Attach the token in the Authorization header
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Failed to get the documents (${response.statusText})");
      const documents: Doc[] = data.documents;
      return { data: documents };
    } catch (error: any) {
      return { error };
    }
  }

  /**
   * Create a new document
   */
  public async CreateDocument(token: string, name: string, description?: string): Promise<CdsResponse<Doc>> {
    try {
      // Build the payload for the document.
      const payload: Partial<Doc> = { name };
      if (description) payload.description = description;
      const response: Response = await fetch(`${this.apiUrl}/document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(`Failed to create document (${response.statusText})`);
      // Return the document from the response (expected in data.document)
      return { data: data.document };
    } catch (error: any) {
      return { error };
    }
  }

  /**
   * Update an existing document
   */
  public async UpdateDocument(token: string, id: string, updatedDoc: Partial<Doc>): Promise<CdsResponse<Doc>> {
    try {
      const response: Response = await fetch(`${this.apiUrl}/document/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(updatedDoc),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(`Failed to update document (${response.statusText})`);
      // Return the document from the response (expected in data.document)
      return { data: data.document };
    } catch (error: any) {
      return { error };
    }
  }

  /**
   * Delete an existing document
   */
  public async DeleteDocument(token: string, id: string): Promise<CdsResponse<string>> {
    try {
      const response: Response = await fetch(`${this.apiUrl}/document/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(`Failed to update document (${response.statusText})`);
      return { data: data.message };
    } catch (error: any) {
      return { error };
    }
  }

  public async fetchDocumentResources(token: string): Promise<CdsResponse<Record<string, Resource>>> {
    try {
      const response = await fetch(`${this.apiUrl}/resources`, {
        method: "GET",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Failed to fetch resources: ${response.statusText}`);
      const resourcesData = await response.json();
      // Transform the response to match the expected format
      const resources: Record<string, Resource> = {};
      for (const res of resourcesData) {
        resources[res.name] = {
          guid: res.id,
          subjectGuid: "", //TODO Not used in new implementation
          fileName: res.name,
          type: res.type, //TODO this.mapResourceType(res.type), // Map to numeric value if needed
          title: res.name,
          blobUrl: res.file_url, //TODO Use the direct URL from Django
          url: res.file_url,
          order: 0, //TODO Not used in new implementation
        };
      }

      return { data: resources };
    } catch (error: any) {
      console.error("Error in fetchSubjectResources:", error);
      return { error: new Error("An unexpected error occurred.") };
    }
  }

  /**
   * Fetches the content tree from the backend.
   */
  public async fetchTree(
    token: string,
    documentId: string
  ): Promise<{ content: Content; error?: never } | { content?: never; error: Error }> {
    const apiUrl = `${this.apiUrl}/document/${documentId}/content`;
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`, // Attach the token in the Authorization header
      },
    };
    const response = await fetch(apiUrl, requestOptions);
    if (!response.ok) return { error: Error(`Error: ${response.status} - ${response.statusText}`) };
    const data = await response.json();
    // Extract the relevant data
    if (!Array.isArray(data)) return { error: Error("data is not an array") };
    if (!(data.length > 0)) return { error: Error("data array is empty") };
    // Format the content tree and store it
    const formattedData = this.formatTree(data[0]); // Assuming a single root
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
      id: node.id,
      name: node.name,
      order: node.order,
      parentId: node.parent,
      level: node.level,
      parent: parent ? parent : undefined,
    };
    const formattedNode: Content = {
      ...parentOfChild,
      // Recurse into children and sort by Order
      children:
        node.children
          .map((child: Content) => this.formatTree(child, parentOfChild))
          .sort((a: Content, b: Content) => a.order - b.order) ?? [],
    };
    return formattedNode;
  };

  // TODO: make this a batch request, this is unbelievably slow
  /**
   * Fetches the aggregated file content for a content node from the new Django endpoint.
   *
   * @param token The authentication token.
   * @param contentId The ID of the root content node.
   * @param includeChildren Whether to recursively include the content of all child nodes.
   * @returns A CdsResponse containing the aggregated content string or an error.
   */
  public async fetchContent(
    token: string,
    content: Content,
    includeChildren: boolean
  ): Promise<CdsResponse<string | undefined>> {
    // Construct the URL with the query parameter
    const apiUrl = `${this.apiUrl}/content/${content.id}/file?include_children=${includeChildren}`;
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${token}`,
      },
    };
    try {
      const response = await fetch(apiUrl, requestOptions);
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data: { content: string } = await response.json();
      // Check if the returned content is empty or just the string "undefined"
      if (!data.content || data.content === "undefined") return { data: undefined };
      return { data: data.content };
    } catch (error) {
      console.error("Failed to fetch content file:", error);
      return { error: error as Error };
    }
  }

  public async setContentFile(
    token: string,
    content: Content,
    htmlString: string,
    fileName: string
  ): Promise<CdsResponse> {
    try {
      const fileBlob = new Blob([htmlString], { type: "text/html" });
      const file = new File([fileBlob], fileName, { type: "text/html" });
      const formData = new FormData();
      formData.append(ContentAttributes.File, file);
      const response = await fetch(`${this.apiUrl}/content/${content.id}`, {
        method: "PATCH",
        headers: { Authorization: `Token ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw data.errors ?? new Error("Error uploading file");
      return { data: undefined };
    } catch (error: any) {
      return { error };
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
   * Create a new content node
   */
  public async CreateContentNode(token: string, node: Content, documentId: Guid): Promise<CdsResponse<{ id: Guid }>> {
    try {
      // Build the payload for the content node.
      const payload: Partial<ContentInterface> = {
        [ContentAttributes.Name]: node.name,
        [ContentAttributes.Order]: node.order,
        [ContentAttributes.Level]: node.level,
        [ContentAttributes.DocumentId]: documentId,
      };
      // If the node has a parent, set up the lookup binding.
      if (node.parent) payload[ContentAttributes.Parent] = node.parent.id;
      const response = await fetch(`${this.apiUrl}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw data.errors ?? new Error("Failed to create content node");
      return { data: { id: data[ContentAttributes.Id] } };
    } catch (error: any) {
      return { error };
    }
  }

  /**
   * Update an existing content node in Dataverse
   */
  public async UpdateContentNode(token: string, node: Content): Promise<CdsResponse<void>> {
    try {
      const payload: Partial<ContentInterface> = { [ContentAttributes.Name]: node.name };
      const response = await fetch(`${this.apiUrl}/content/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw data.errors ?? new Error("Failed to update content node");
      return { data: undefined };
    } catch (error: any) {
      return { error };
    }
  }

  /**
   * Delete a content node from Dataverse
   */
  public async DeleteContentNode(token: string, node: Content): Promise<CdsResponse<void>> {
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
          `${this.apiRoute}/content/${content.id}`,
          {},
          { Authorization: `Token ${token}` },
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
        const res: any[] = await batchRequest.execute(token);
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
   * Resequence content nodes in Dataverse based on the provided newContent structure.
   * This method uses a batch request to efficiently update the order of multiple content nodes.
   *
   * @param newContent - An array of Content objects representing the new sequence and hierarchy.
   * @returns A CdsResponse containing the updated Content objects or an error.
   */
  public async SaveContentSequence(token: string, newContent: Content[]): Promise<CdsResponse<Content[]>> {
    // Initialize BatchRequest with the Organization URL
    const batchRequest = new BatchRequest(this.ClientUrl);
    /**
     * Recursively processes a content node by adding a corresponding update (PATCH)
     * operation to the batch request. Also processes any and child nodes.
     *
     * @param content - The current content node being processed.
     */
    const processNode = (content: Content) => {
      // Build payload with updated fields.
      const payload: Partial<ContentInterface> = { [ContentAttributes.Order]: content.order };
      // If the node has a parent, reference the parent's persisted ID.
      if (content.parent) payload[ContentAttributes.Parent] = content.parent.id;
      // Add PATCH operation (update) for the existing node.
      batchRequest.addOperation(
        HTTPMethod.PATCH,
        `${this.apiRoute}/content/${content.id}`,
        payload,
        { "Content-Type": "application/json", Authorization: `Token ${token}` },
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
      const res: any[] = await batchRequest.execute(token);
      return { data: res }; // No errors, resequencing is successful
    } catch (error: any) {
      console.error("Batch Request Error:", error);
      return { error: error };
    }
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
}
