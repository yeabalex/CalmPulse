import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CalmPulse — AI Stress & Pacing Companion",
  description: "CalmPulse translates daily stress logs and venting journals into personalized daily habit plans with the help of a 1-on-1 AI pacing companion.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CalmPulse"
  }
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#0f172a] dark:bg-[#03070c] dark:text-[#f8fafc]">
        {children}
        
        {/* Client-side PWA service worker registration */}
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      console.log('CalmPulse PWA ServiceWorker active. Scope: ', reg.scope);
                    },
                    function(err) {
                      console.error('CalmPulse PWA ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
