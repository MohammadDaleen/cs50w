import type { Guid } from "./index";
import { axa_resourcetype } from "../cds-generated/enums/axa_resourcetype";

export type Resource = {
  guid: Guid;
  subjectGuid: Guid;
  fileName: string;
  type: axa_resourcetype;
  title: string;
  blobUrl?: string;
  url: string;
  order?: number;
};
