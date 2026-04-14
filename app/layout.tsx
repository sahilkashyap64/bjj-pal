import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegistrar } from "./pwa-registrar";
import { ThemeRegistrar } from "./theme-registrar";

export const metadata: Metadata = {
  title: "BJJ Pal",
  description: "BJJ session and technique tracker",
  manifest: "manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "32x32" }],
    apple: [{ url: "/icons/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemeRegistrar />
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
