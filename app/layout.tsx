import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "스쿨픽",
  description: "학교 급식과 시간표를 한 번에",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-[#f6f7f9] text-gray-900 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}