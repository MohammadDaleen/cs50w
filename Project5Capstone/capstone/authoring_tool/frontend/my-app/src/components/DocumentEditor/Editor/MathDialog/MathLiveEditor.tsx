import { Field, makeStyles, Textarea, tokens } from "@fluentui/react-components";
import React, { useRef, useCallback } from "react";
import { useVM } from "../../../../viewModel/context";
import { observer } from "mobx-react-lite";
import "mathlive";
import { MathfieldElement } from "mathlive";
import "mathlive/fonts.css";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>;
    }
  }
}

// Define styles using Fluent UI's makeStyles
const useStyles = makeStyles({
  container: {
    width: "100%",
    height: "100%", // parent must have a defined height (page/layout must provide it)
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    boxSizing: "border-box",
    minHeight: "0px", // allow children to shrink in flex layouts
  },
});

export const MathLiveEditor = observer(() => {
  const vm = useVM();
  const styles = useStyles();

  // Holds the live MathfieldElement reference
  const mfRef = useRef<MathfieldElement | null>(null);
  // Holds a function that will remove all attached event listeners;
  // it is replaced whenever listeners are re-attached to avoid leaks.
  const cleanupRef = useRef<(() => void) | null>(null);

  /**
   * A callback ref to configure the math-field element when it is attached
   *
   * It receives the math-field element when React attaches it (or null on detach).
   */
  const setMfRef = useCallback((el: MathfieldElement | null) => {
    // cleanup previous listeners if any
    if (cleanupRef.current) {
      try {
        cleanupRef.current(); // running previous cleanup
      } catch (err) {
        cleanupRef.current = null; // ensure previous cleanup is cleared
        vm.AddError(`Error during previous cleanup`);
        console.error(`Error during previous cleanup:`, err);
      }
    }
    // If el is null, clear mfRef and return.
    if (!el) {
      mfRef.current = null;
      vm.MathfieldRef = mfRef; // sync VM ref
      return;
    }
    mfRef.current = el; // Store current math-field element
    vm.MathfieldRef = mfRef; // sync VM ref
    // safe guards and initialization
    try {
      el.smartFence = true; // automatically convert parentheses to \left...\right markup.
      el.mathVirtualKeyboardPolicy = "manual"; // Do not show the virtual keyboard panel automatically.
      document.body.style.setProperty("--keyboard-zindex", "1000002"); // Set CSS variable for keyboard overlay z-index control.
      document.body.style.setProperty("--suggestion-zindex", "1000002"); // Set CSS variable for suggestion popover overlay z-index control.
      // document.body.setAttribute("theme", "light"); // Set theme
      const mvk = window.mathVirtualKeyboard; // Get the virtual keyboard
      mvk.layouts = ["numeric", "symbols", "greek"]; // Set available keyboard layouts (tabs)
      MathfieldElement.soundsDirectory = null; // Disable the sounds
    } catch (err) {
      vm.AddError(`Failed to set initial properties`);
      console.error(`Failed to set initial properties`, err);
    }

    // input listener
    const onInput = (evt: Event) => {
      try {
        const inputEvt = evt as InputEvent; // Cast the generic Event to InputEvent
        const target = inputEvt.target as MathfieldElement;
        let latex: string | undefined = undefined;
        latex = target.getValue("latex"); // Determine the latex value
        vm.Latex = latex;
      } catch (err) {
        vm.AddError(`Error in onInput`);
        console.error(`Error in onInput`, err);
      }
    };

    // Attach listeners
    try {
      el.addEventListener("input", onInput);
    } catch (err) {
      vm.AddError(`Failed to attach listeners`);
      console.error(`Failed to attach listeners`, err);
    }

    // store cleanup function
    cleanupRef.current = () => {
      try {
        const mvk = window.mathVirtualKeyboard;
        mvk.hide(); // ensure kyboard is hidden
        el.removeEventListener("input", onInput);
      } catch (err) {
        vm.AddError(`Error during cleanup removal`);
        console.error(`Error during cleanup removal`, err);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <math-field
        ref={setMfRef}
        style={{
          fontSize: "1.44em",
          borderColor: tokens.colorNeutralStrokeDisabled,
          borderRadius: tokens.borderRadiusMedium,
          padding: tokens.spacingVerticalSNudge,
        }}
      >
        {vm.Latex}
      </math-field>
      <Field label="LaTeX:">
        <Textarea value={vm.Latex} onChange={(_ev, data) => (vm.Latex = data.value)} />
      </Field>
    </div>
  );
});
