import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { BundledEditor } from "./BundledEditor";
import { useVM } from "../../viewModel/context";
import type { Editor as TinyMCEEditor } from "tinymce/tinymce";
import { installImageOverlay, installMathEditor } from ".";

export const TinyMCE = observer(() => {
  const vm = useVM(); // Access the ViewModel from context
  const editorRef = useRef<TinyMCEEditor | null>(null); // Ref for TinyMCE editor

  // This ref stores the "baseline" content: either the initial content loaded into the editor,
  // or the last saved value. We always compare changes against this reference to decide if the editor is "dirty".
  const initialContent = useRef<string | null>(null);

  useEffect(() => {
    vm.TinyMceEditorRef = editorRef;
  }, [editorRef]);

  useEffect(() => {
    vm.TinyMceInitialContentRef = initialContent;
  }, [initialContent]);

  const handleEditorSetup = (editor: TinyMCEEditor) => {
    editor.ui.registry.addButton("attachments", {
      icon: "gallery",
      tooltip: "Insert/Edit Attachments",
      onAction: () => {
        vm.ToggleAttachmentsDialog();
      },
    });
    editor.on("PostProcess", (e) => {
      if (e.output) {
        e.output = e.output.replace(/ sandbox="[^"]*"/g, "");
      }
    });
    // Sanitize pasted content immediately
    editor.on("PastePreProcess", (e) => {
      // e.content contains the pasted HTML string
      // if anything fails, fall back to an empty string
      e.content = vm.SanitizeEditorHtml(e.content ?? "") ?? "";
    });

    // install the image overlay
    installImageOverlay(editor, vm);
    // install the math editor
    installMathEditor(editor, vm);
  };

  // This function is called *whenever* the editor content changes (either from user input or sometimes on init).
  // We compare the new content to our initial/saved value:
  // - If they differ, mark as dirty.
  // - If they're the same, not dirty.
  // This ensures we ignore false dirty events caused by TinyMCE firing a change event on initialization.
  const handleEditorChange = (newValue: string, _editor: TinyMCEEditor) => {
    vm.CurrentHtml = newValue;
    // Only set dirty if the current value is different from the initial (last saved) value.
    // This is the most robust check: even if TinyMCE fires a change event on init, this will NOT mark as dirty.
    // It also catches any real changes made by the user later.
    if (initialContent.current !== newValue) {
      vm.IsDirty = true;
    } else {
      vm.IsDirty = false;
    }
  };

  return (
    <BundledEditor
      // This is called once, after TinyMCE editor is initialized.
      // It captures the initial content so we know what "not dirty" looks like.
      // We do this here because for some reason TinyMCE may or may not fire a change event on initialization.
      onInit={(_e, editor: TinyMCEEditor) => {
        if (!vm.TinyMceEditorRef) {
          vm.AddError("Couldn't find the editor's reference");
          return;
        }
        vm.TinyMceEditorRef.current = editor; // Initialize editor ref
        // Capture the initial value of the editor after it loads.
        // This handles all cases, whether the editor fires a change event or not on init.
        initialContent.current = editor.getContent({ format: "html" });
        vm.IsDirty = false; // Editor is not dirty immediately after loading content.
        /* Remove default border and border radius from the editor container */
        const element = editor.getContainer();
        if (element) {
          element.style.border = "unset"; // Remove default border
          element.style.borderRadius = "unset"; // Remove default border radius
        } else console.warn("Editor container not found during setup.");
      }}
      init={{
        plugins: [
          "advlist",
          "autolink",
          "autosave",
          "charmap",
          "code",
          "codesample",
          "directionality",
          "help",
          "link",
          "lists",
          "importcss",
          "preview",
          "quickbars",
          "save",
          "searchreplace",
          "table",
          "visualblocks",
          "visualchars",
          "wordcount",
        ],
        menubar: "edit view insert format tools table help",
        removed_menuitems: "fontfamily fontsize",
        toolbar:
          "undo redo | blocks | " +
          "bold italic underline strikethrough outdent indent forecolor backcolor ltr rtl removeformat | " +
          "align numlist bullist lineheight hr | " +
          "codesample table charmap link attachments math| " +
          "code preview save ",
        // link_target_list: [{ title: "New Window", value: "_blank" }],
        link_target_list: false,
        link_default_target: "_blank",
        autosave_ask_before_unload: true,
        autosave_interval: "30s",
        autosave_prefix: "{path}{query}-{id}-",
        autosave_restore_when_empty: false,
        autosave_retention: "2m",
        importcss_append: true,
        file_picker_types: "file",
        quickbars_insert_toolbar: "attachments math table link",
        height: "100%",
        width: "100%",
        image_caption: true,
        quickbars_selection_toolbar: "bold italic | quicklink h2 h3 blockquote",
        noneditable_class: "mceNonEditable",
        toolbar_mode: "sliding",
        contextmenu: "attachments math table link",
        skin: "oxide",
        content_css: vm.CssResources.map((resource) => resource.blobUrl ?? resource.url),
        content_css_cors: true,
        promotion: false,
        // This to hide additional empty audio player when playing audio in the editor
        content_style: ".mce-offscreen-selection{display:none!important}",
        // This is called after a successful save operation.
        // It updates our reference content to the latest value,
        // ensuring further changes are compared to the new saved state.
        save_onsavecallback: async () => {
          // SaveEditorContent Implicitly updates the "initialContent" ref to the new value that was just saved.
          // This way, the next user change will be compared to the latest saved version,
          // and IsDirty will be false immediately after saving.
          await vm.SaveEditorContent();
        },
        setup: handleEditorSetup,
      }}
      initialValue={vm.SelectedNode?.htmlContent ?? ""}
      value={vm.CurrentHtml}
      onEditorChange={handleEditorChange}
    />
  );
});
