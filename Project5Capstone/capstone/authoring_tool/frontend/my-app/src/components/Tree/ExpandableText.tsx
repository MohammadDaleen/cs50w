import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  makeStyles,
  Tooltip,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  textWrapper: {
    display: "block", // Ensures the element behaves like a block-level container
    wordWrap: "break-word", // Breaks long words and wraps them to the next line
    overflowWrap: "break-word", // Similar to word-wrap; ensures proper wrapping
    whiteSpace: "normal", // Allows the text to wrap
    overflow: "visible", // Ensures no clipping happens
  },
});

/**
 * ExpandableText Component
 * Displays a text snippet with an option to expand or collapse if the text length exceeds a defined limit.
 *
 * Props:
 * - text (string): The text to display, which may be truncated if it exceeds the `maxPreviewLength`.
 */
export const ExpandableText = observer(({ text }: { text: string }) => {
  const styles = useStyles();

  const [textRef, setTextRef] = React.useState<HTMLSpanElement | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [maxPreviewLength, setMaxPreviewLength] = useState(40); // Default preview length
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Calculate the number of characters that fit within the container width based on text rendering.
   */
  const updateMaxPreviewLength = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;

      // Create a temporary canvas to measure text width
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) return;

      // Get the computed font style of the container
      const computedStyle = window.getComputedStyle(containerRef.current);
      const font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
      context.font = font;

      let accumulatedWidth = 0;
      let calculatedLength = 0;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charWidth = context.measureText(char).width;

        if (accumulatedWidth + charWidth > containerWidth) {
          break;
        }

        accumulatedWidth += charWidth;
        calculatedLength = i + 1;
      }

      setMaxPreviewLength(calculatedLength);
    }
  };

  // Use ResizeObserver to recalculate when the container size changes
  useEffect(() => {
    const observer = new ResizeObserver(updateMaxPreviewLength);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Initial calculation
    updateMaxPreviewLength();

    return () => {
      observer.disconnect();
    };
  }, []);

  /**
   * Handles the toggle between expanded and collapsed states.
   * Prevents the click event from propagating to parent components.
   */
  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling to TreeItem
    setIsExpanded((prev) => !prev);
  };

  // Determine if the text should be truncated
  const isTruncated = text.length > maxPreviewLength;

  return (
    <Tooltip
      withArrow
      content={text}
      relationship="label"
      positioning={{ target: textRef }}
    >
      <div className={styles.textWrapper} ref={containerRef}>
        {/* Display the text. Show full or truncated text based on the `isExpanded` state. */}
        <span ref={setTextRef}>
          {isExpanded
            ? `${text} ` // Full text with a trailing space
            : isTruncated // Check if text needs truncation.
              ? `${text.slice(0, maxPreviewLength - 15)}... ` // Truncated text with ellipsis
              : text}{" "}
          {/* If text is shorter than the maximum length, show it fully. */}
        </span>

        {/* Display a toggle link only if the text exceeds the truncation limit */}
        {isTruncated && (
          <Link onClick={handleToggle}>
            {isExpanded ? "Show less" : "Show more"}
          </Link>
        )}
      </div>
    </Tooltip>
  );
});
