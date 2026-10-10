import { Designer } from "@/components/builder/designer";
import { Footer, Header } from "@/components/site-chrome";
import type { Locale } from "@/content/dictionary";
import { getDictionary } from "@/content/dictionary";

// The nail designer page: the site header, the designer and a compact
// footer. The mobile dock is left out because the designer's bottom sheet
// occupies that space.
const DesignerPage = ({ locale }: Readonly<{ locale: Locale }>) => {
  const dictionary = getDictionary(locale);

  return (
    <>
      <Header locale={locale} page="designer" nav={dictionary.nav} />
      <main className="flex-1">
        <Designer locale={locale} copy={dictionary.designer} />
      </main>
      <Footer footer={dictionary.footer} compact />
    </>
  );
};

export default DesignerPage;
