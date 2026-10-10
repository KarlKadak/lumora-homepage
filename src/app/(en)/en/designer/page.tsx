import type { Metadata } from "next";
import DesignerPage from "@/components/designer-page";
import { buildMetadata } from "@/content/metadata";

const EnglishDesignerPage = () => <DesignerPage locale="en" />;

const metadata: Metadata = buildMetadata("en", "designer");

export { metadata };

export default EnglishDesignerPage;
