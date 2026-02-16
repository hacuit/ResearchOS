import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research OS",
  description: "Research idea dashboard and project management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
