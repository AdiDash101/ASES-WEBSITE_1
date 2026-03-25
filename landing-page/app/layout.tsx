import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const cocogoose = localFont({
  src: [
    {
      path: "./fonts/cocogoose-light.ttf",
      weight: "300",
      style: "normal"
    },
    {
      path: "./fonts/cocogoose-regular.ttf",
      weight: "400",
      style: "normal"
    },
    {
      path: "./fonts/cocogoose-semilight.ttf",
      weight: "500",
      style: "normal"
    },
    {
      path: "./fonts/cocogoose-bold.ttf",
      weight: "700",
      style: "normal"
    }
  ],
  variable: "--font-display",
  display: "swap"
});

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
      <body className={cocogoose.variable}>{children}</body>
    </html>
  );
}
