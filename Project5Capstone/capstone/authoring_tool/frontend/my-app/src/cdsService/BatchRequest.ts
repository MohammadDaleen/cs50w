export type TOperation = {
  method: string;
  url: string;
  body?: object;
  headers?: Record<string, string>;
  changeset: boolean;
  contentId: number;
};

export enum HTTPMethod {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export default class BatchRequest {
  private orgUrl: string;
  private operations: Array<TOperation>;
  private batchBoundary: string;
  private contentIdCounter: number;

  constructor(orgUrl: string) {
    this.orgUrl = orgUrl;
    this.operations = [];
    this.batchBoundary = this.generateBoundary("batch");
    this.contentIdCounter = 1; // Initialize Content-ID counter
  }

  /**
   * Adds an operation to the batch request.
   * @param method - HTTP method (e.g., "POST", "PATCH", "DELETE", "GET").
   * @param url - Relative API endpoint (e.g., "/api/data/v9.0/accounts").
   * @param body - Optional JSON body for the request.
   * @param headers - Optional additional headers.
   * @param changeset - Whether the operation should be part of a changeset.
   * @returns The content ID assigned to this operation.
   */
  addOperation(
    method: HTTPMethod,
    url: string,
    body?: object,
    headers: Record<string, string> = {},
    changeset: boolean = false
  ): number {
    const operation: TOperation = {
      method: method.toUpperCase(),
      url,
      body,
      headers,
      changeset,
      contentId: this.contentIdCounter++,
    };
    this.operations.push(operation);
    return operation.contentId;
  }

  /**
   * Builds the complete MIME multipart body for the batch request.
   * @returns The batch request body as a string.
   */
  private buildBatchBody(): string {
    let body = "";

    // Group operations by changeset
    const changesetOperations = this.operations.filter((op) => op.changeset);
    const standaloneOperations = this.operations.filter((op) => !op.changeset);

    // Add changeset if there are operations to include
    if (changesetOperations.length > 0) {
      const changesetBoundary = this.generateBoundary("changeset");
      body += `--batch_${this.batchBoundary}\r\n`;
      body += `Content-Type: multipart/mixed; boundary=changeset_${changesetBoundary}\r\n\r\n`;

      changesetOperations.forEach((op) => {
        body += `--changeset_${changesetBoundary}\r\n`;
        body += `Content-Type: application/http\r\n`;
        body += `Content-Transfer-Encoding: binary\r\n`;
        body += `Content-ID: ${op.contentId}\r\n\r\n`;

        body += `${op.method} ${op.url} HTTP/1.1\r\n`;
        body += `Content-Type: application/json; charset=utf-8\r\n\r\n`;

        if (op.body) {
          body += `${JSON.stringify(op.body)}\r\n`;
        }
      });

      body += `--changeset_${changesetBoundary}--\r\n`;
    }

    // Add standalone operations
    standaloneOperations.forEach((op) => {
      body += `--batch_${this.batchBoundary}\r\n`;
      body += `Content-Type: application/http\r\n`;
      body += `Content-Transfer-Encoding: binary\r\n`;
      body += `Content-ID: ${op.contentId}\r\n\r\n`;

      body += `${op.method} ${op.url} HTTP/1.1\r\n`;
      body += `Content-Type: application/json; charset=utf-8\r\n\r\n`;

      if (op.body) {
        body += `${JSON.stringify(op.body)}\r\n`;
      }
    });

    body += `--batch_${this.batchBoundary}--\r\n`;

    return body;
  }

  /**
   * Generates a unique boundary string.
   * @param prefix - Prefix for the boundary (e.g., "batch", "changeset").
   * @returns A unique boundary string.
   */
  private generateBoundary(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Executes the batch request.
   * @returns A promise resolving to an array of responses.
   */
  async execute(): Promise<any[]> {
    const batchBody = this.buildBatchBody();
    const headers = {
      "Content-Type": `multipart/mixed; boundary=batch_${this.batchBoundary}`,
      "OData-Version": "4.0",
      "OData-MaxVersion": "4.0",
      Accept: "application/json",
    };

    const response = await fetch(`${this.orgUrl}/api/data/v9.0/$batch`, {
      method: "POST",
      headers: headers,
      body: batchBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Batch request failed: ${errorText}`);
    }

    const responseText = await response.text();
    return this.parseBatchResponse(responseText, response.headers.get("Content-Type") || "");
  }

  /**
   * Parses the batch response from the Web API.
   * @param responseText - The raw text response.
   * @param contentType - The Content-Type header from the response.
   * @returns An array of parsed responses mapped by Content-ID.
   */
  private parseBatchResponse(responseText: string, contentType: string): any[] {
    // Extract the batch boundary (handles any prefix like "batchresponse_")
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    const boundary = boundaryMatch ? boundaryMatch[1] || boundaryMatch[2] : null;

    if (!boundary) {
      throw new Error("Boundary not found in Content-Type header");
    }

    const batchParts = responseText.split(`--${boundary}`);
    const results: any[] = [];

    batchParts.forEach((part) => {
      const trimmedPart = part.trim();
      if (trimmedPart.length === 0 || trimmedPart === "--") {
        return; // Skip empty parts or closing boundary
      }

      // Check if this part contains a changeset
      if (trimmedPart.startsWith("Content-Type: multipart/mixed; boundary=")) {
        // Extract the changeset boundary
        const changesetBoundaryMatch = trimmedPart.match(/boundary=changesetresponse_(.+)/);
        const changesetBoundary = changesetBoundaryMatch ? changesetBoundaryMatch[1] : null;

        if (!changesetBoundary) {
          console.warn("Changeset boundary not found.");
          return;
        }

        // Split the changeset part into individual responses
        const changesetParts = trimmedPart.split(`--changesetresponse_${changesetBoundary}`);

        changesetParts.forEach((changePart) => {
          const trimmedChangePart = changePart.trim();
          if (trimmedChangePart.length === 0 || trimmedChangePart === "--") {
            return; // Skip empty parts or closing boundary
          }

          // Split headers and body
          const [rawHeaders, ...bodyParts] = trimmedChangePart.split("\r\n\r\n");
          if (!rawHeaders || bodyParts.length === 0) {
            return;
          }

          // Parse the part headers
          const headers = this.parseHeaders(rawHeaders);

          // Check for Content-Type: application/http
          if (headers["Content-Type"]?.includes("application/http")) {
            // The body contains the HTTP response
            const httpResponse = bodyParts.join("\r\n\r\n").trim();

            // Split the HTTP response into lines
            const httpResponseLines = httpResponse.split("\r\n");
            const statusLine = httpResponseLines[0];
            const statusLineMatch = statusLine.match(/HTTP\/1\.1 (\d{3}) (.+)/);

            if (statusLineMatch) {
              const statusCode = parseInt(statusLineMatch[1], 10);
              const statusText = statusLineMatch[2];

              // Extract response headers
              const emptyLineIndex = httpResponseLines.findIndex((line) => line.trim() === "");
              const responseHeadersLines =
                emptyLineIndex !== -1 ? httpResponseLines.slice(1, emptyLineIndex) : httpResponseLines.slice(1);
              const responseHeadersMap = this.parseHeaders(responseHeadersLines.join("\r\n"));

              // Extract response body
              const responseBodyLines = emptyLineIndex !== -1 ? httpResponseLines.slice(emptyLineIndex + 1) : [];
              const responseBody = responseBodyLines.join("\r\n").trim();

              // Get Content-ID from the part's headers
              const contentId = headers["Content-ID"];

              // Initialize the result object
              const result: any = {
                contentId,
                statusCode,
                statusText,
                headers: responseHeadersMap,
                body: null, // Will be set if there's a body
              };

              // Only attempt to parse body if status code is not 204 No Content
              if (statusCode !== 204 && responseBody) {
                try {
                  result.body = JSON.parse(responseBody);
                } catch (e) {
                  // If parsing fails, retain the raw body
                  result.body = responseBody;
                }
              }

              results.push(result);
            }
          }
        });
      } else {
        // This part is a standalone operation (not within a changeset)
        // Split headers and body
        const [rawHeaders, ...bodyParts] = trimmedPart.split("\r\n\r\n");
        if (!rawHeaders) {
          return;
        }

        // Parse the part headers
        const headers = this.parseHeaders(rawHeaders);

        // Check for Content-Type: application/http
        if (headers["Content-Type"]?.includes("application/http")) {
          // The body contains the HTTP response
          const httpResponse = bodyParts.join("\r\n\r\n").trim();

          // Split the HTTP response into lines
          const httpResponseLines = httpResponse.split("\r\n");
          const statusLine = httpResponseLines[0];
          const statusLineMatch = statusLine.match(/HTTP\/1\.1 (\d{3}) (.+)/);

          if (statusLineMatch) {
            const statusCode = parseInt(statusLineMatch[1], 10);
            const statusText = statusLineMatch[2];

            // Extract response headers
            const emptyLineIndex = httpResponseLines.findIndex((line) => line.trim() === "");
            const responseHeadersLines =
              emptyLineIndex !== -1 ? httpResponseLines.slice(1, emptyLineIndex) : httpResponseLines.slice(1);
            const responseHeadersMap = this.parseHeaders(responseHeadersLines.join("\r\n"));

            // Extract response body
            const responseBodyLines = emptyLineIndex !== -1 ? httpResponseLines.slice(emptyLineIndex + 1) : [];
            const responseBody = responseBodyLines.join("\r\n").trim();

            // Get Content-ID from the part's headers
            const contentId = headers["Content-ID"];

            // Initialize the result object
            const result: any = {
              contentId,
              statusCode,
              statusText,
              headers: responseHeadersMap,
              body: null, // Will be set if there's a body
            };

            // Only attempt to parse body if status code is not 204 No Content
            if (statusCode !== 204 && responseBody) {
              try {
                result.body = JSON.parse(responseBody);
              } catch (e) {
                // If parsing fails, retain the raw body
                result.body = responseBody;
              }
            }

            results.push(result);
          }
        }
      }
    });

    return results;
  }

  /**
   * Parses raw header strings into a key-value map.
   * @param rawHeaders - The raw header string.
   * @returns A map of header names to values.
   */
  private parseHeaders(rawHeaders: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const lines = rawHeaders.split("\r\n");
    lines.forEach((line) => {
      const separatorIndex = line.indexOf(": ");
      if (separatorIndex > -1) {
        const key = line.substring(0, separatorIndex).trim();
        const value = line.substring(separatorIndex + 2).trim();
        headers[key] = value;
      }
    });
    return headers;
  }
}
