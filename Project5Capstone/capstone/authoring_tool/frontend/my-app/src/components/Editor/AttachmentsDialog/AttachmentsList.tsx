import { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  Button,
  createTableColumn,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  TableCellLayout,
  type TableColumnDefinition,
} from "@fluentui/react-components";
import { useVM } from "../../../viewModel/context";
import { AddRegular, DeleteRegular, ImageRegular, VideoRegular, MicRegular, AppsRegular } from "@fluentui/react-icons";
import type { Attachment } from "../../../types";
import { RawImageDialog } from ".";
import { filetype } from "../../../enums";

type FileCell = { label: string; icon: JSX.Element };

type TypeCell = { label: string };

type Item = { guid: string; file: FileCell; type: TypeCell };

export const AttachmentList = observer(() => {
  const vm = useVM();
  const [isRawDialogOpen, setIsRawDialogOpen] = useState(false);
  const [attachmentId, setAttachmentId] = useState<string | undefined>(undefined);

  const items = vm.SelectedNode?.attachments
    ? Object.values(vm.SelectedNode?.attachments)
        .filter((a) => a.fileName)
        .map((attachment) => {
          const { icon, typeLabel } =
            attachment.type === filetype.Image
              ? { icon: <ImageRegular />, typeLabel: "Image" }
              : attachment.type === filetype.Video
              ? { icon: <VideoRegular />, typeLabel: "Video" }
              : attachment.type === filetype.Audio
              ? { icon: <MicRegular />, typeLabel: "Audio" }
              : attachment.type === filetype.InteractiveModel
              ? { icon: <AppsRegular />, typeLabel: "Interactive Model" }
              : { icon: <AppsRegular />, typeLabel: "Other" };
          return {
            guid: attachment.guid,
            file: {
              label: attachment.fileName,
              icon,
            },
            type: {
              label: typeLabel,
            },
          };
        })
    : [];

  const columns: TableColumnDefinition<Item>[] = [
    createTableColumn<Item>({
      columnId: "file",
      compare: (a, b) => a.file.label.localeCompare(b.file.label),
      renderHeaderCell: () => "File",
      renderCell: (item) => (
        <TableCellLayout media={item.file.icon} style={{ whiteSpace: "wrap", wordBreak: "break-word" }}>
          {item.file.label}
        </TableCellLayout>
      ),
    }),
    createTableColumn<Item>({
      columnId: "type",
      compare: (a, b) => a.type.label.localeCompare(b.type.label),
      renderHeaderCell: () => "Type",
      renderCell: (item) => <TableCellLayout>{item.type.label}</TableCellLayout>,
    }),
    createTableColumn<Item>({
      columnId: "actions",
      renderHeaderCell: () => "Actions",
      renderCell: (item) => {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "start",
              alignItems: "center",
              width: "100%",
              gap: "0.5rem",
            }}
          >
            <Button icon={<AddRegular />} onClick={() => vm.InsertAttachment(item.guid)}>
              Insert
            </Button>
            {item.type.label === "Image" ? (
              <Button
                icon={<AddRegular />}
                onClick={() => {
                  setAttachmentId(item.guid);
                  setIsRawDialogOpen(true);
                }}
              >
                Insert Inline
              </Button>
            ) : (
              <></>
            )}
            <Button
              icon={<DeleteRegular onClick={() => vm.DeleteAttachment(item.guid)} />}
              style={{ marginLeft: "1rem" }}
            />
          </div>
        );
      },
    }),
  ];

  return (
    <>
      <DataGrid columns={columns} sortable width="100%" items={vm.IsAttachmentsDialogLoading ? [] : items}>
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<Attachment>>
          {({ item, rowId }) => (
            <DataGridRow<Attachment> key={rowId}>
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
      {isRawDialogOpen && attachmentId !== undefined && (
        <RawImageDialog
          isOpen={isRawDialogOpen && attachmentId !== undefined}
          setIsOpen={setIsRawDialogOpen}
          attachmentId={attachmentId || ""}
        />
      )}
    </>
  );
});
