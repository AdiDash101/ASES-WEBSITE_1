import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ASES Manila Landing Page",
  description: "Design system foundation for the ASES Manila landing page."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

