import type { Metadata } from "next";

import "@/assets/css/global.css";

export const metadata: Metadata = {
  title: "The Edit — Curated finds",
  description: "Thoughtful edits, lovely finds, and the stories behind them.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
