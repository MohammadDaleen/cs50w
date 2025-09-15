import { ContentAttributes, type Content as ContentInterface } from "../entities/Content";

import type { Guid, User, Resource, CdsResponse, Attachment, Content, Doc } from "../types/index";

import BatchRequest, { HTTPMethod } from "./BatchRequest";

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

  // Fetches all attachments for a given content ID
  public async fetchAttachments(token: string, contentId: Guid): Promise<CdsResponse<Attachment[]>> {
    const apiUrl = `${this.apiUrl}/content/${contentId}/attachments`;
    const requestOptions = { method: "GET", headers: { Authorization: `Token ${token}` } };
    try {
      const response = await fetch(apiUrl, requestOptions);
      if (!response.ok) throw new Error(`Error fetching attachments: ${response.statusText}`);
      const data = await response.json();
      const attachments: Attachment[] = data.map((att: any) => ({
        guid: att.id,
        content: att.content,
        fileName: att.name,
        url: att.file_url,
        type: att.type,
        uploaded_at: att.uploaded_at,
      }));
      return { data: attachments };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Uploads a file as an attachment to a given content ID
  public async UploadContentAttachment(token: string, contentId: Guid, file: File): Promise<CdsResponse<Attachment>> {
    const apiUrl = `${this.apiUrl}/content/${contentId}/attachments`;
    // Use FormData for multipart file uploads
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name); // Send original filename
    const requestOptions = {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        // IMPORTANT: DO NOT set 'Content-Type'. The browser will automatically
        // set it to 'multipart/form-data' with the correct boundary.
      },
      body: formData,
    };
    try {
      const response = await fetch(apiUrl, requestOptions);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error uploading file: ${JSON.stringify(errorData)}`);
      }
      const data = await response.json();
      const attachment: Attachment = {
        guid: data.id,
        fileName: data.name,
        url: data.file_url,
        type: data.type,
        uploaded_at: data.uploaded_at,
      };
      return { data: attachment };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Deletes a specific attachment by its ID
  public async DeleteAttachment(token: string, attachmentId: Guid): Promise<CdsResponse<{ id: Guid }>> {
    const apiUrl = `${this.apiUrl}/attachments/${attachmentId}`;
    const requestOptions = { method: "DELETE", headers: { Authorization: `Token ${token}` } };
    try {
      const response = await fetch(apiUrl, requestOptions);
      if (!response.ok) throw new Error(`Error deleting attachment: ${response.statusText}`);
      // Parse the JSON body to get the returned ID
      const data: { id: Guid } = await response.json();
      return { data }; // Success
    } catch (error) {
      return { error: error as Error };
    }
  }

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
}
