import { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  Button,
  Card,
  CardHeader,
  createTableColumn,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  makeStyles,
  TableCellLayout,
  tokens,
  type TableColumnDefinition,
} from "@fluentui/react-components";
import { useVM } from "../../../../viewModel/context";
import { AddRegular, DeleteRegular, ImageRegular, VideoRegular, MicRegular, AppsRegular } from "@fluentui/react-icons";
import type { Attachment } from "../../../../types";
import { RawImageDialog } from ".";
import { filetype } from "../../../../enums";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";

const useStyles = makeStyles({
  // Styles for the mobile card layout
  card: { border: "1px solid grey", borderRadius: tokens.borderRadiusLarge },
  cardHeader: { gap: "8px" },
  // Container for the action buttons within a card
  cardActions: {
    display: "flex",
    flexWrap: "wrap", // Allow buttons to wrap on very small screens
    gap: "8px",
    marginTop: "8px",
    justifyContent: "flex-start",
  },
});

type FileCell = { label: string; icon: JSX.Element };

type TypeCell = { label: string };

type Item = { guid: string; file: FileCell; type: TypeCell };

export const AttachmentList = observer(() => {
  const vm = useVM();
  const styles = useStyles();
  const isMobile = useMediaQuery();
  const [isRawDialogOpen, setIsRawDialogOpen] = useState(false);
  const [attachmentId, setAttachmentId] = useState<string | undefined>(undefined);

  const items = vm.SelectedNode?.attachments
    ? Object.values(vm.SelectedNode?.attachments)
        .filter((a) => a.fileName)
        .map((attachment) => {
          const { icon, typeLabel } =
            attachment.type === filetype.Image
              ? { icon: <ImageRegular fontSize={"2rem"} />, typeLabel: "Image" }
              : attachment.type === filetype.Video
              ? { icon: <VideoRegular fontSize={"2rem"} />, typeLabel: "Video" }
              : attachment.type === filetype.Audio
              ? { icon: <MicRegular fontSize={"2rem"} />, typeLabel: "Audio" }
              : { icon: <AppsRegular fontSize={"2rem"} />, typeLabel: "Other" };
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
            <Button className="ms-auto" icon={<DeleteRegular onClick={() => vm.DeleteAttachment(item.guid)} />} />
          </div>
        );
      },
    }),
  ];

  const columnSizingOptions = {
    file: {
      defaultWidth: 440,
    },
    type: {
      defaultWidth: 100,
    },
    actions: {
      defaultWidth: 460,
    },
  };

  /**
   * Renders the action buttons for an attachment item.
   * Used by both the DataGrid and the mobile Card view.
   * @param {Item} item The attachment item.
   * @returns {JSX.Element}
   */
  const renderActions = (item: Item) => (
    <div className={isMobile ? styles.cardActions : undefined} style={!isMobile ? { display: "flex", gap: "8px" } : {}}>
      <Button icon={<AddRegular />} onClick={() => vm.InsertAttachment(item.guid)}>
        Insert
      </Button>
      {item.type.label === "Image" && (
        <Button
          icon={<AddRegular />}
          onClick={() => {
            setAttachmentId(item.guid);
            setIsRawDialogOpen(true);
          }}
        >
          Insert Inline
        </Button>
      )}
      <Button
        icon={<DeleteRegular />}
        onClick={() => vm.DeleteAttachment(item.guid)}
        style={{ marginLeft: isMobile ? undefined : "1rem" }}
      />
    </div>
  );

  // Desktop view using DataGrid
  const DesktopView = () => (
    <DataGrid
      columns={columns}
      sortable
      width="100%"
      items={vm.IsAttachmentsDialogLoading ? [] : items}
      resizableColumns
      columnSizingOptions={columnSizingOptions}
    >
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
  );

  // Mobile view using a list of Cards
  const MobileView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map((item) => (
        <Card key={item.guid} className={styles.card + "my-1"}>
          <CardHeader
            className={styles.cardHeader}
            image={item.file.icon}
            header={<div style={{ whiteSpace: "wrap", wordBreak: "break-word" }}>File: {item.file.label}</div>}
            description={"Type: " + item.type.label}
          />
          {renderActions(item)}
        </Card>
      ))}
    </div>
  );

  return (
    <>
      {/* Conditionally render the appropriate view based on screen size */}
      {isMobile ? <MobileView /> : <DesktopView />}
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
