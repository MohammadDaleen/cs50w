import type { Guid } from ".";
import type { filetype } from "../enums";

export type Attachment = {
  guid: Guid;
  url: string;
  fileName: string;
  type: filetype;
  uploaded_at: string;
};
