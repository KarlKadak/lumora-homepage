import type { MetadataRoute } from "next";
import { getDictionary, SITE_NAME } from "@/content/dictionary";

// Static export: Next writes this out as /manifest.webmanifest at build time.
const manifest = (): MetadataRoute.Manifest => ({
  name: SITE_NAME,
  short_name: "Lumora",
  description: getDictionary("et").meta.description,
  lang: "et",
  start_url: "/",
  display: "browser",
  background_color: "#2a0510",
  theme_color: "#2a0510",
  icons: [
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  ],
});

// Metadata routes need force-static under output: "export". Next reads the
// value at compile time, so it has to be a direct named export.
export const dynamic = "force-static";

export default manifest;
