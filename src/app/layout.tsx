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
  // Extend the canvas under the notch / Dynamic Island / gesture bar so we can
  // manage those areas ourselves with safe-area insets. Zoom stays enabled for
  // accessibility (no maximum-scale / user-scalable lock).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Restore the saved theme before first paint to avoid a flash of the
            default light palette. Mirrors localStorage written by applyTheme. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('daily-os-theme');if(t==='dark'||t==='paper'){var r=document.documentElement;r.setAttribute('data-theme',t);r.style.colorScheme=(t==='dark'?'dark':'light');var c=(t==='dark'?'#17171B':'#F4EDE0');var m=document.querySelector('meta[name=\"theme-color\"]');if(m)m.setAttribute('content',c);}}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-dvh bg-canvas text-ink">
        {children}
        <PwaController />
      </body>
    </html>
  );
}
