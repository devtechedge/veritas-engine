import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veritas Self-Correcting Multi-Agent Engine",
  description: "A professional architectural intelligence engine driven by serverless state graphs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950">{children}</body>
    </html>
  );
}