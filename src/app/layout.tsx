import type { Metadata } from "next";
import AppWrap from "@/app/AppWrap";
import "./globals.css";
import { ToastContainer } from "react-toastify";

import 'react-toastify/dist/ReactToastify.css';

export const metadata: Metadata = {
  title: "Ai Coach",
  description: "VIP trial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`antialiased`}>
        <ToastContainer />
        <AppWrap>
          {children}
        </AppWrap>
      </body>
    </html>
  );
}
