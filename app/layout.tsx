import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CLATians LMS",
  description: "India's Best CLAT & CUET Preparation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#d1d5db", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
