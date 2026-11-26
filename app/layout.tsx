import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse — a Spotify web client",
  description: "A responsive Spotify client built with Next.js, the Web API and the Web Playback SDK.",
};

export const viewport: Viewport = {
  themeColor: "#08040f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
