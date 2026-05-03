import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "虾局长 P0 Demo",
  description: "QQ 群聊式互动原型：收口、投票、成局、回忆。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
