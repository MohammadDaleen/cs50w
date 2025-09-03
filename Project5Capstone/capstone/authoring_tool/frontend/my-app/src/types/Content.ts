import type { Guid } from "./index";

export type Content = {
  children?: Content[];
  id: Guid;
  name: string;
  order: number;
  parent?: Content; // TODO: create Parent type having less attrs than Content
  parentId?: string;
  path?: string;
  referenceID?: string;
  treeLevel: number;
};
