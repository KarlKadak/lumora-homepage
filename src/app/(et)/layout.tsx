import type { Metadata } from "next";
import RootDocument from "@/components/root-document";
import { buildMetadata } from "@/content/metadata";

const EstonianLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => (
  <RootDocument locale="et">{children}</RootDocument>
);

const metadata: Metadata = buildMetadata("et");

export { metadata };

export default EstonianLayout;
