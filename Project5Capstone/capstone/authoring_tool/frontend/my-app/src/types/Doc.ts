import type { Guid } from "./Guid";

export type Doc = {
  id: Guid;
  name: string;
  description: string;
  author: string;
  timestamp: string;
  root_content_node_id: string;
};
