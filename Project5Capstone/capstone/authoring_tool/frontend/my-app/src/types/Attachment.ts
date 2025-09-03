import { Guid } from "cdsify";
import { axa_filetype } from "../cds-generated/enums/axa_filetype";

export type Attachment = {
  guid: Guid;
  url: string;
  fileName: string;
  path?: string;
  type: axa_filetype;
};
