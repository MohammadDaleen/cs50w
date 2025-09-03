export const contentMetadata = {
  logicalName: "content",
  collectionName: "contents",
  primaryIdAttribute: "axa_contentid",
};

export enum ContentAttributes {
  ContentFile = "contentfile",
  ContentFile_Name = "contentfile_name",
  ContentId = "contentid",
  CourseCategory = "coursecategory",
  CourseCategoryName = "coursecategoryname",
  LearningObjective = "learningobjective",
  Name = "name",
  Order = "order",
  Parent = "parent",
  ParentName = "parentname",
  Path = "path",
  QuestionsCount = "questionscount",
  QuestionsCount_Date = "questionscount_date",
  QuestionsCount_State = "questionscount_state",
  ReferenceID = "referenceid",
  TreeLevel = "treelevel",
  Type = "type",
}

import type { Guid } from "../types";

export interface Content {
  // Content File File The actual HTML file of this node
  contentfile?: File | null;
  // Content UniqueidentifierType Unique identifier for entity instances
  contentid?: Guid | null;
  // Subject [Required] LookupType
  coursecategory?: any; //TODO import("cdsify").EntityReference;
  // Learning Objective BooleanType
  learningobjective?: boolean | null;
  // Name [Required] StringType
  name?: string;
  // Order IntegerType
  order?: number | null;
  // Parent LookupType
  parent?: any; //TODO import("cdsify").EntityReference | null;
  // Path StringType
  path?: string | null;
  // Reference ID StringType
  referenceid?: string | null;
  // Tree Level [Required] IntegerType
  treelevel?: number;
}
