import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces, Literata } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display : titres de leçons, grands chiffres
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

// Lecture longue : corps des leçons
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumen",
  description: "5 minutes par jour pour une culture générale qui reste.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7ee" },
    { media: "(prefers-color-scheme: dark)", color: "#171209" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="sunrise min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
