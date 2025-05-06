import type { Metadata } from "next";
import AppWrap from "@/app/AppWrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Realtime API Agents",
  description: "A demo app from OpenAI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <AppWrap>
          {children}
        </AppWrap>
      </body>
    </html>
  );
}
