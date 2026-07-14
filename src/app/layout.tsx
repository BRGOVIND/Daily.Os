import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaController } from "@/components/pwa/PwaController";

export const metadata: Metadata = {
  metadataBase: new URL("https://daily-os.local"),
  title: "Daily OS — Your day, beautifully organized",
  description:
    "A calm, offline-first Daily Operating System. Every day has its own workspace. Open a date, not a to-do list.",
  applicationName: "Daily OS",
  appleWebApp: {
    capable: true,
    title: "Daily OS",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#FCF4F7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-canvas text-ink">
        {children}
        <PwaController />
      </body>
    </html>
  );
}
