import "./globals.css";

export const metadata = {
  title: "Realtime Stream",
  description: "Live data streaming demo (SSE) — Next.js + Vercel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
