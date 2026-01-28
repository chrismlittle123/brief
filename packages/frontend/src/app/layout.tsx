import type { Metadata } from "next";
import { Geist, Cedarville_Cursive } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cedarvilleCursive = Cedarville_Cursive({
  variable: "--font-cursive",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brief - Weekly Updates Made Easy",
  description: "Talk through your update in 5 minutes. Brief writes the report.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${cedarvilleCursive.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
