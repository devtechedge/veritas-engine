import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veritas Engine — Self-Correcting Multi-Agent Research",
  description:
    "Planner, retrieval, critic loop, and Markdown synthesis for sourced technical briefs.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
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
