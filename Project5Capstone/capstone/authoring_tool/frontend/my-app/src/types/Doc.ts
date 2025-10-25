import type { Guid } from "./Guid";

export type Doc = {
  id: Guid;
  name: string;
  description: string;
  author: string;
  timestamp: Date;
  root_content_node_id: string;
  content_node_count: number;
};
