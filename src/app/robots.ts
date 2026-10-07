import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/dictionary";

// Static export: Next writes this out as /robots.txt at build time.
const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: "*", allow: "/" },
  sitemap: `${SITE_URL}/sitemap.xml`,
});

// Metadata routes need force-static under output: "export". Next reads the
// value at compile time, so it has to be a direct named export.
export const dynamic = "force-static";

export default robots;
