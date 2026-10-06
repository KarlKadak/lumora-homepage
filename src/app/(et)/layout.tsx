import type { Metadata } from "next";
import RootDocument from "@/components/root-document";
import { getDictionary } from "@/content/dictionary";

const { meta } = getDictionary("et");

const EstonianLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => (
  <RootDocument locale="et">{children}</RootDocument>
);

const metadata: Metadata = { title: meta.title, description: meta.description };

export { metadata };

export default EstonianLayout;
