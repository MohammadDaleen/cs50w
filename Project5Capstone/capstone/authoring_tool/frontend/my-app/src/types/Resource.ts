import type { resourcetype } from "../enums";
import type { Guid } from "./index";

export type Resource = {
  guid: Guid;
  subjectGuid: Guid;
  fileName: string;
  type: resourcetype;
  title: string;
  blobUrl?: string;
  url: string;
  order?: number;
};
