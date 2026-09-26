import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font — no runtime requests, no layout shift.
// Poppins is the geometric, rounded sans that reads as a modern study app.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-poppins",
});

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
    <html lang="en" className={poppins.variable}>
      <body style={{ margin: 0, padding: 0, minHeight: "100vh", fontFamily: "var(--font-poppins)" }}>
        {children}
      </body>
    </html>
  );
}
