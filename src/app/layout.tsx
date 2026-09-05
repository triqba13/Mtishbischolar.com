import type { Metadata } from "next";
import Script from "next/script";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const baseUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://mtishbischolar.com"
).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "MtishbiScholars: Study Abroad & University Admissions for Tanzanian Students",
    template: "%s | MtishbiScholars",
  },
  description:
    "MtishbiScholars helps Tanzanian students discover international universities, explore scholarships, submit university applications, manage admission documents, and receive support throughout their study abroad journey.",
  keywords: [
    "MtishbiScholars",
    "Mtishbi Scholars",
    "MtishbiScholars Tanzania",
    "study abroad Tanzania",
    "study abroad for Tanzanian students",
    "universities abroad for Tanzanian students",
    "international universities Tanzania",
    "university applications Tanzania",
    "study in India for Tanzanian students",
    "scholarships for Tanzanian students",
    "international student admissions",
    "overseas education Tanzania",
    "university admission Tanzania",
    "study overseas Tanzania",
    "scholarships abroad Tanzania",
    "international education Tanzania",
  ],
  authors: [{ name: "MtishbiScholars", url: baseUrl }],
  creator: "MtishbiScholars",
  publisher: "MtishbiScholars",
  applicationName: "MtishbiScholars",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_TZ",
    url: "/",
    siteName: "MtishbiScholars",
    title: "MtishbiScholars: Study Abroad & University Admissions for Tanzanian Students",
    description:
      "Discover international universities, scholarships, and application support for Tanzanian students with MtishbiScholars.",
    images: [
      {
        url: "/logo.png",
        alt: "MtishbiScholars: Study Abroad & University Admissions for Tanzanian Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MtishbiScholars: Study Abroad & University Admissions",
    description:
      "Discover universities, scholarships, and application support for Tanzanian students with MtishbiScholars.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      "google89835c77cb77f8f8",
  },
};

import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import CookieConsentBanner from "@/components/analytics/CookieConsentBanner";
// import TariqChatWidget from "@/components/ai/TariqChatWidget";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="dns-prefetch" href="https://qjhggpmbuqnywjlvrvfif.supabase.co" />
      </head>
      <body className="antialiased bg-white text-slate-900 font-sans">
        <Script
          id="theme-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('mtb_theme') || 'light';
                var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <GoogleAnalytics />
        {children}
        {/* <TariqChatWidget /> */}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
