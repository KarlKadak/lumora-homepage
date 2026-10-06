import type { NextConfig } from "next";

// Static export deployed to GitHub Pages. Served from a custom domain at the
// root, so no basePath. trailingSlash makes /about/ resolve to about/index.html
// on a plain static host. The image optimizer needs a server, so it is off.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
