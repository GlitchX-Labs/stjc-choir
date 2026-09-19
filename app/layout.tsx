import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import "./globals.css";

const head = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-head" });
const body = Outfit({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "STJC Song Tracker",
  description: "Saint Teresa's Junior Choir, Nungambakkam",
};
export const viewport: Viewport = { themeColor: "#0A0A0C", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${head.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
