// src/components/Editor/imageOverlay.ts
import type { Editor as TinyMCEEditor } from "tinymce/tinymce";
import { resizeImageByFactor, setImageMaxSize, setImageMinSize, STEP } from ".";
import type AuthoringToolVM from "../../viewModel/AuthoringToolVM";

/**
 * Installs the image overlay functionality for TinyMCE editor.
 * Adds buttons to resize images and a context toolbar for image manipulation.
 * @param editor - The TinyMCE editor instance.
 * @param vm - The ViewModel instance for error handling.
 * @return void
 * */
export function installImageOverlay(editor: TinyMCEEditor, vm: AuthoringToolVM) {
  /**
   * Finds the currently selected image in the editor.
   *
   * If no image is selected, returns null.
   *
   * Shows & logs an error if the selection fails.
   */
  function findSelectedImage(): HTMLImageElement | null {
    try {
      const node = editor.selection?.getNode?.();
      if (node && (node as HTMLElement).nodeName === "IMG") return node as HTMLImageElement;
    } catch (e: any) {
      vm.AddError(`Failed to find selected image: ${e.message}`);
      console.error(`Failed to find selected image:`, e);
    }
    return null;
  }

  /**
   * Registers a button in the TinyMCE editor.
   *
   * Adds a button with the specified ID, tooltip, icon, and action.
   * @param id - The ID of the button.
   * @param tooltip - The tooltip text for the button.
   * @param iconName - The icon name for the button.
   * @param action - The action to perform when the button is clicked.
   */
  function registerButton(
    id: string,
    tooltip: string,
    iconName: string | undefined,
    action: (img: HTMLImageElement) => void
  ) {
    try {
      editor.ui.registry.addButton(id, {
        tooltip: tooltip,
        icon: iconName,
        onAction: (_api) => {
          const img = findSelectedImage();
          if (!img) return;
          action(img); // perform the resize action
          // ensure editor knows about DOM changes and has an undo snapshot
          editor.nodeChanged();
          editor.setDirty(true);
          editor.undoManager.add();
        },
      });
    } catch (e: any) {
      vm.AddError(`Failed to register button ${id}: ${e.message}`);
      console.error(`Failed to register button ${id}:`, e);
    }
  }

  // Register buttons for image resizing and manipulation
  registerButton("ax-img-max", "Max Size", "fullscreen", (img) => setImageMaxSize(img, editor.getContainer(), editor));
  registerButton("ax-img-inc", "Increase Size", "plus", (img) => resizeImageByFactor(img, 1 + STEP, editor));
  registerButton("ax-img-dec", "Decrease Size", "minus", (img) => resizeImageByFactor(img, 1 - STEP, editor));
  registerButton("ax-img-min", "Min Size", "edit-image", (img) => setImageMinSize(img, editor));

  // Register context toolbar for images
  try {
    editor.ui.registry.addContextToolbar("ax-image-toolbar", {
      predicate: (node) => node.nodeName.toLowerCase() === "img",
      items: "ax-img-max ax-img-inc ax-img-dec ax-img-min",
      position: "node",
      scope: "node",
    });
  } catch (e: any) {
    vm.AddError(`Failed to register context toolbar for images: ${e.message}`);
    console.error(`Failed to register context toolbar for images:`, e);
  }
}
