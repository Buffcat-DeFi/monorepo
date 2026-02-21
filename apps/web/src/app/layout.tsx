import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { CustomLayout } from "@/components/CustomLayout";
import { buffcatWebsiteMetadata, jsonLd } from "./metadata";

const font = Inter({
  variable: "--font-custom-font",
  subsets: ["latin"],
});

export const metadata: Metadata = buffcatWebsiteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${font.variable} antialiased bg-custom-root-bg text-custom-root-text font-semibold`}
      >
        <CustomLayout>{children}</CustomLayout>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
