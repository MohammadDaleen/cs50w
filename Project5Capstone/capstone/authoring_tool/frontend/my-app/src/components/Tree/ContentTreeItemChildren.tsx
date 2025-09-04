import { observer } from "mobx-react";
import type { Content } from "../../types/Content";
import { ContentTreeItem } from "./ContentTreeItem";

export const ContentTreeItemChildren = observer(({ content, level }: { content: Content; level: string }) => {
  if (!content.children?.length) return null;

  return (
    <>
      {content.children.map((child) => (
        <ContentTreeItem key={child.id} record={child} level={level} />
      ))}
    </>
  );
});
