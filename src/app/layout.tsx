import type { Metadata } from "next";
import "./globals.css";

const PAGE_TITLE = "Veritas Engine - Self-Correcting Multi-Agent Research";
const PAGE_DESCRIPTION =
  "Planner, retrieval, critic loop, and Markdown synthesis for sourced technical briefs.";
const SITE_URL = "https://veritas-engine-woad.vercel.app";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  // Shared links (LinkedIn, Slack, email) render a bare URL without these.
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    images: [{ url: 'https://veritas-engine-woad.vercel.app/og.png', width: 1200, height: 630, alt: 'Veritas Engine - Self-Correcting Multi-Agent Research' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: ['https://veritas-engine-woad.vercel.app/og.png'],
  },
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
