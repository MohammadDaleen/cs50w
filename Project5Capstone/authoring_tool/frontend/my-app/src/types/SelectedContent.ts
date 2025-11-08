import type { Attachment, Content } from "./index";

export type SelectedContent = Content & {
  htmlContent?: string;
  attachments: Record<string, Attachment>;
};
