import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font"; 
import "./globals.css";

export const metadata: Metadata = {
  title: "Systems Level Programming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
