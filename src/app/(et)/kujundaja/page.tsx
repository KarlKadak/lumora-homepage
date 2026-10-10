import type { Metadata } from "next";
import DesignerPage from "@/components/designer-page";
import { buildMetadata } from "@/content/metadata";

const EstonianDesignerPage = () => <DesignerPage locale="et" />;

const metadata: Metadata = buildMetadata("et", "designer");

export { metadata };

export default EstonianDesignerPage;
