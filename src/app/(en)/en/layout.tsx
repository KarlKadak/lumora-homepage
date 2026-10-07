import type { Metadata } from "next";
import RootDocument from "@/components/root-document";
import { buildMetadata } from "@/content/metadata";

const EnglishLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => (
  <RootDocument locale="en">{children}</RootDocument>
);

const metadata: Metadata = buildMetadata("en");

export { metadata };

export default EnglishLayout;
