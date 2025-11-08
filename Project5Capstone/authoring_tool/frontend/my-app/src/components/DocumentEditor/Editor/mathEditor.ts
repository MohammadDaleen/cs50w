// src/components/Editor/imageOverlay.ts
import type { Editor as TinyMCEEditor } from "tinymce/tinymce";
import type AuthoringToolVM from "../../../viewModel/AuthoringToolVM";
import type { ToolbarButtonInstanceApi } from "../../../types";

/**
 * Installs the math editor functionality for TinyMCE editor.
 * Adds buttons to create new equations and a context toolbar for manipulating existing equations.
 * @param editor - The TinyMCE editor instance.
 * @param vm - The ViewModel instance for error handling.
 * @return void
 * */
export function installMathEditor(editor: TinyMCEEditor, vm: AuthoringToolVM) {
  /**
   * Registers a button in the TinyMCE editor.
   *
   * Adds a button with the specified ID, tooltip, icon, and on action callback.
   * @param id - The ID of the button.
   * @param tooltip - The tooltip text for the button.
   * @param iconName - The icon name for the button.
   * @param onAction - The on action callback to perform when the button is clicked.
   */
  function registerButton(
    id: string,
    tooltip: string,
    iconName: string | undefined,
    onAction: (api: ToolbarButtonInstanceApi) => void
  ) {
    try {
      editor.ui.registry.addButton(id, {
        tooltip: tooltip,
        icon: iconName,
        onAction: onAction,
      });
    } catch (err) {
      vm.AddError(`Failed to register button ${id}`);
      console.error(`Failed to register button ${id}:`, err);
    }
  }

  // Register buttons for math editor
  // Main toolbar button: only opens dialog
  registerButton("math", "Insert Math Equation", "math-equation", () => vm.ToggleMathDialog());
  // Context-toolbar button: captures LaTeX, opens dialog, replaces the old formula div when a new one is inserted
  registerButton("math-edit", "Edit Math Equation", "math-equation", () => {
    const selectedNode = editor.selection.getNode();
    const formulaDiv = editor.dom.getParent(selectedNode, "div.formula");
    if (!formulaDiv) throw new Error("Could not find the formula");
    // Store bookmark into VM so InsertEquation later can restore where the old formula was
    vm.FormulaBookmark = editor.selection.getBookmark(2, true);
    // Extract latex
    const latex = formulaDiv.textContent || formulaDiv.innerHTML;
    // Open the dialog with the latex preloaded.
    vm.ToggleMathDialog(latex);
  });

  // Register context toolbar for math equations editing
  try {
    editor.ui.registry.addContextToolbar("math-formula-toolbar", {
      // Show toolbar when a formula div is selected
      predicate: (node) => {
        return editor.dom.is(node, "div.formula") || editor.dom.getParent(node, "div.formula") !== null;
      },
      items: "math-edit",
      position: "node",
      scope: "node",
    });
  } catch (err) {
    vm.AddError(`Failed to register context toolbar for math equations editing`);
    console.error(`Failed to register context toolbar for math equations editing:`, err);
  }

  // Attach an event listener for keydown events in the editor
  try {
    editor.on("keydown", (e) => {
      const isEnter = e.key === "Enter";
      if (!isEnter) return; // ensure pressed key is "Enter"
      const node = editor.selection.getNode(); // get currently selected node inside editor
      const formula = editor.dom.getParent(node, "div.formula");
      if (!formula) return; // ensure it is pressed on a formula
      e.preventDefault(); // Prevent TinyMCE's default Enter behavior (which would insert a new formula div)

      /* Create a DOM Range after the formula and move the editor selection into it */
      const doc = editor.getDoc(); // Get a reference to the editor's underlying document
      const range = doc.createRange(); // Create a new DOM range positioned right after the current formula div
      range.setStartAfter(formula); // Start range immediately after formula div
      range.collapse(true); // Collapse range to a caret position
      editor.selection.setRng(range); // Update editor selection with this range
      editor.insertContent("<p>&nbsp;</p>"); // Insert a new empty paragraph (<p>) after the formula div
      // Locate the newly inserted paragraph robustly
      let nextEl = formula.nextElementSibling;
      if (!nextEl || nextEl.nodeName.toLowerCase() !== "p") {
        const parent = formula.parentElement;
        if (!parent) throw new Error("Could not find parent after insertion");
        // Look through parent's children to find the paragraph immediately after formula
        let found: Element | null = null;
        for (let i = 0; i < parent.children.length - 1; i++) {
          if (parent.children[i] === formula) {
            const cand = parent.children[i + 1];
            if (cand && cand.nodeName.toLowerCase() === "p") {
              found = cand;
              break;
            }
          }
        }
        nextEl = found;
      }
      // Ensure paragraph is found after insertion
      if (!nextEl) throw new Error("Inserted paragraph not found");
      // Move caret into the newly inserted paragraph
      editor.selection.select(nextEl, true);
      editor.selection.collapse(true);
    });
  } catch (err) {
    vm.AddError(`Unexpected error while handling Enter key on formula`);
    console.error(`Unexpected error while handling Enter key on formula:`, err);
  }
}
