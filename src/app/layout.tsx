import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Trip Tracker — Travel Memory Engine",
  description: "Private, high-leverage itinerary and memory capture system for premium travel.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trip Tracker",
  },
  icons: {
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body style={{ fontFamily: "var(--font-inter), sans-serif" }}>
        <div style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
