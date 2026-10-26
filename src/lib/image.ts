/**
 * Review image handling.
 *
 * Photos are resized and re-encoded in the browser before they are stored with
 * the review, so a 4 MB phone photo becomes a small JPEG (well under the 300 KB
 * per-image limit the review form enforces).
 */
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 300 * 1024;

export async function compressReviewImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be attached.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Each image must be smaller than 8 MB.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("That image could not be read."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("That image could not be decoded."));
    element.src = dataUrl;
  });

  const maxDimension = 1000;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is unavailable in this browser.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.75;
  let output = canvas.toDataURL("image/jpeg", quality);
  while (output.length * 0.75 > MAX_OUTPUT_BYTES && quality > 0.35) {
    quality -= 0.1;
    output = canvas.toDataURL("image/jpeg", quality);
  }

  if (output.length * 0.75 > MAX_OUTPUT_BYTES) {
    throw new Error("That image is too detailed to attach — try a smaller photo.");
  }
  return output;
}
