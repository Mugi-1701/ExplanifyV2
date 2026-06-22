import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: "Explanify - AI Coordination Dashboard",
  description: "Premium AI-native task and project coordination for modern teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#050816] text-white">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
