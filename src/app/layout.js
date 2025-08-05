// File Location: src/app/layout.js
"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConfigProvider, theme } from 'antd';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigProvider
          theme={{
            algorithm: theme.darkAlgorithm,
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}