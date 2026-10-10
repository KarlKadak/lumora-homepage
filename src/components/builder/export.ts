// The download: the live hand SVGs and face-on nail SVGs are serialised,
// rasterised and composed into one collage on a canvas.

interface Captions {
  title: string;
  subtitle: string;
  date: string;
  left: string;
  right: string;
  // A label under each tile: the finger names, or the shape's name.
  tiles: readonly string[];
}

interface ExportInput {
  left: SVGSVGElement;
  right: SVGSVGElement;
  // Ten nails, left hand then right, or a single nail when every nail
  // wears the same design.
  tiles: readonly SVGSVGElement[];
  captions: Captions;
}

const SCALE = 2;
const WIDTH = 1200 * SCALE;
const HEIGHT = 800 * SCALE;

// A standalone copy of a live SVG: the interactive halos are dropped and the
// root gets explicit dimensions, which Safari needs to rasterise it.
const serialise = (svg: SVGSVGElement, width: number, height: number) => {
  const clone = svg.cloneNode(true) as SVGSVGElement;

  for (const halo of clone.querySelectorAll("[data-halo], [data-handles]")) {
    halo.remove();
  }
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.removeAttribute("class");
  clone.removeAttribute("style");

  return new XMLSerializer().serializeToString(clone);
};

const rasterise = (markup: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.addEventListener("load", () => {
      URL.revokeObjectURL(url);
      resolve(image);
    });
    image.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("The SVG could not be rasterised"));
    });
    image.src = url;
  });

const fontFamily = (variable: string, fallback: string) => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();

  return value ? `${value}, ${fallback}` : fallback;
};

const composeCollage = async ({
  left,
  right,
  tiles,
  captions,
}: ExportInput): Promise<Blob> => {
  const height = HEIGHT;
  const canvas = document.createElement("canvas");

  canvas.width = WIDTH;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) throw new Error("No 2D context");

  const handHeight = 760 * SCALE * 0.5;
  // The hands' SVGs show a 400 × 440 crop of their frame.
  const handWidth = (handHeight * 400) / 440;
  const tileHeight = 150 * SCALE;
  const tileWidth = (tileHeight * 80) / 220;
  const [leftImage, rightImage, ...tileImages] = await Promise.all([
    rasterise(serialise(left, handWidth, handHeight)),
    rasterise(serialise(right, handWidth, handHeight)),
    ...tiles.map((tile) => rasterise(serialise(tile, tileWidth, tileHeight))),
  ]);

  await document.fonts.ready;

  // Background: the hero's radial burgundy.
  const gradient = context.createRadialGradient(
    WIDTH / 2,
    height / 2,
    0,
    WIDTH / 2,
    height / 2,
    WIDTH * 0.7,
  );

  gradient.addColorStop(0, "#4a0d1c");
  gradient.addColorStop(1, "#2a0510");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, height);

  // Header.
  const serif = fontFamily("--font-cormorant", "'Times New Roman', serif");
  const sans = fontFamily("--font-manrope", "system-ui, sans-serif");
  const margin = 60 * SCALE;

  context.fillStyle = "#fbf5f3";
  context.textBaseline = "alphabetic";
  context.font = `500 ${String(56 * SCALE)}px ${serif}`;
  context.fillText(captions.title, margin, 78 * SCALE);
  context.fillStyle = "#cf8e80";
  context.font = `600 ${String(11 * SCALE)}px ${sans}`;
  context.letterSpacing = `${String(4 * SCALE)}px`;
  context.fillText(
    captions.subtitle.toUpperCase(),
    margin + 2 * SCALE,
    100 * SCALE,
  );
  context.letterSpacing = "0px";
  context.fillStyle = "rgba(251, 245, 243, 0.7)";
  context.font = `500 ${String(14 * SCALE)}px ${sans}`;
  context.textAlign = "right";
  context.fillText(captions.date, WIDTH - margin, 78 * SCALE);

  // Hands side by side.
  const gap = 40 * SCALE;
  const handsTop = 120 * SCALE;
  const leftX = WIDTH / 2 - gap / 2 - handWidth;
  const rightX = WIDTH / 2 + gap / 2;

  context.drawImage(leftImage, leftX, handsTop, handWidth, handHeight);
  context.drawImage(rightImage, rightX, handsTop, handWidth, handHeight);
  context.textAlign = "center";
  context.fillStyle = "#fbf5f3";
  context.font = `500 ${String(22 * SCALE)}px ${serif}`;
  const captionY = handsTop + handHeight + 32 * SCALE;

  context.fillText(captions.left, leftX + handWidth / 2, captionY);
  context.fillText(captions.right, rightX + handWidth / 2, captionY);

  // The nail tiles: two groups of five under their hands, or one nail in
  // the middle when the whole set is alike.
  const rowTop = captionY + 36 * SCALE;
  const step = 64 * SCALE;
  const groupWidth = step * 4 + tileWidth;
  const groups = [
    leftX + handWidth / 2 - groupWidth / 2,
    rightX + handWidth / 2 - groupWidth / 2,
  ];
  const tileX = (index: number) =>
    tileImages.length === 1 ?
      WIDTH / 2 - tileWidth / 2
    : (groups[Math.floor(index / 5)] ?? 0) + (index % 5) * step;

  context.font = `600 ${String(9 * SCALE)}px ${sans}`;
  for (const [index, image] of tileImages.entries()) {
    const x = tileX(index);

    context.drawImage(image, x, rowTop, tileWidth, tileHeight);
    context.fillStyle = "rgba(251, 245, 243, 0.75)";
    context.fillText(
      captions.tiles[index] ?? "",
      x + tileWidth / 2,
      rowTop + tileHeight + 16 * SCALE,
    );
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The canvas could not be encoded"));
    }, "image/png");
  });
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

const canShareFiles = (): boolean => {
  try {
    const probe = new File([""], "probe.png", { type: "image/png" });

    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
};

const shareBlob = async (blob: Blob, fileName: string, title: string) => {
  const file = new File([blob], fileName, { type: "image/png" });

  await navigator.share({ files: [file], title });
};

const todayStamp = () => new Date().toISOString().slice(0, 10);

export { canShareFiles, composeCollage, downloadBlob, shareBlob, todayStamp };

export type { Captions, ExportInput };
