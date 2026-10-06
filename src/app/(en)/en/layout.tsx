import type { Metadata } from "next";
import RootDocument from "@/components/root-document";
import { getDictionary } from "@/content/dictionary";

const { meta } = getDictionary("en");

const EnglishLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => (
  <RootDocument locale="en">{children}</RootDocument>
);

const metadata: Metadata = { title: meta.title, description: meta.description };

export { metadata };

export default EnglishLayout;
