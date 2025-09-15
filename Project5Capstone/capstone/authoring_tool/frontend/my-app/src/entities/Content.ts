export const contentMetadata = {
  logicalName: "content",
  collectionName: "contents",
};

export enum ContentAttributes {
  File = "file",
  Id = "id",
  DocumentId = "document",
  Name = "name",
  Order = "order",
  Parent = "parent",
  ParentName = "parentname",
  Level = "level",
}

import type { Guid } from "../types";

export interface Content {
  // UniqueidentifierType Unique identifier for entity instances
  id?: Guid | null;
  // Name [Required] StringType
  name?: string;
  // File File The actual HTML file of this node
  file?: File | null;
  // Parent ID LookupType
  parent?: Guid;
  // Order IntegerType
  order?: number | null;
  // Document ID [Required] LookupType
  document?: Guid;
  // Level [Required] IntegerType
  level?: number;
}
