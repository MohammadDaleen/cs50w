import type { Editor as TinyMCEEditor } from "tinymce/tinymce";

export const STEP = 0.1;
export const MIN_WIDTH_PX = 32;

/**
 * Calculates the new width for an image based on a resize factor.
 *
 * Ensures the new width is at least MIN_WIDTH_PX.
 */
export function calcNewWidth(img: HTMLImageElement, factor: number) {
  const win = img.ownerDocument?.defaultView ?? window;
  const computed = win.getComputedStyle(img);
  const curWidth = parseFloat(computed.width || `${img.width}px`) || img.width;
  return Math.max(MIN_WIDTH_PX, Math.round(curWidth * factor));
}

/**
 * Resizes an image by a given factor, maintaining aspect ratio.
 *
 * Updates the image's width and height styles.
 */
export function resizeImageByFactor(img: HTMLImageElement, factor: number, editor: TinyMCEEditor) {
  const newWidth = calcNewWidth(img, factor);
  editor.dom.setStyle(img, "width", `${newWidth}px`);
  editor.dom.setStyle(img, "height", "auto");
}

/**
 * Sets the minimum width for an image, maintaining aspect ratio.
 *
 * Updates the image's width and height styles to ensure it does not shrink below MIN_WIDTH_PX.
 */
export function setImageMinSize(img: HTMLImageElement, editor: TinyMCEEditor) {
  const value = `${MIN_WIDTH_PX}px`;
  editor.dom.setStyle(img, "width", value);
  editor.dom.setStyle(img, "height", "auto");
}

/**
 * Sets the maximum width for an image based on the container's width.
 *
 * Updates the image's width and height styles to ensure it does not exceed 95% of the container's width.
 */
export function setImageMaxSize(img: HTMLImageElement, containerElement: HTMLElement, editor: TinyMCEEditor) {
  const containerWidth = containerElement.clientWidth;

  const natural = img.naturalWidth || containerWidth;
  const target = Math.min(natural, Math.round(containerWidth * 0.95));
  const value = `${Math.max(MIN_WIDTH_PX, target)}px`;

  editor.dom.setStyle(img, "width", value);
  editor.dom.setStyle(img, "height", "auto");
}
