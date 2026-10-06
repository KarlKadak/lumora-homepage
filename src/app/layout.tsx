import "./globals.css";
import type { Metadata } from "next";

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html lang="en" className="h-full antialiased">
    <body className="flex min-h-full flex-col">{children}</body>
  </html>
);

const metadata: Metadata = { title: "Lumora", description: "Lumora homepage" };

export { metadata };

export default RootLayout;
