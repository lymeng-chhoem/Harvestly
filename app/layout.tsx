import { Kantumruy_Pro } from "next/font/google";
import type { ReactNode } from "react";
import { FirebaseAnalytics } from "@/components/FirebaseAnalytics";
import "./globals.css";

const kantumruyPro = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
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
      <body className={kantumruyPro.variable}>
        <FirebaseAnalytics />
        {children}
      </body>
    </html>
  );
}
