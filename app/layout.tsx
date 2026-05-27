import { Kantumruy_Pro, Poppins } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

const kantumruyPro = Kantumruy_Pro({
  subsets: ["khmer"],
  weight: ["400", "600", "700"],
  variable: "--font-kantumruy-pro",
});

export const metadata = {
  title: "Harvestly | Crop Care",
  description: "Crop health guidance for Cambodian farmers",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="km">
      <body className={`${poppins.variable} ${kantumruyPro.variable}`}>{children}</body>
    </html>
  );
}
