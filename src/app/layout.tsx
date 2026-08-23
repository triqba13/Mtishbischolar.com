import type { Metadata } from "next";
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
    default: "MtishbiScholar — Study Abroad & University Admissions for Tanzanian Students",
    template: "%s | MtishbiScholar",
  },
  description:
    "MtishbiScholar helps Tanzanian students discover international universities, explore scholarships, submit university applications, manage admission documents, and receive support throughout their study abroad journey.",
  keywords: [
    "MtishbiScholar",
    "Mtishbi Scholar",
    "MtishbiScholar Tanzania",
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
  authors: [{ name: "MtishbiScholar", url: baseUrl }],
  creator: "MtishbiScholar",
  publisher: "MtishbiScholar",
  applicationName: "MtishbiScholar",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_TZ",
    url: "/",
    siteName: "MtishbiScholar",
    title: "MtishbiScholar — Study Abroad & University Admissions for Tanzanian Students",
    description:
      "Discover international universities, scholarships, and application support for Tanzanian students with MtishbiScholar.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MtishbiScholar — Study Abroad & University Admissions for Tanzanian Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MtishbiScholar — Study Abroad & University Admissions",
    description:
      "Discover universities, scholarships, and application support for Tanzanian students with MtishbiScholar.",
    images: ["/og-image.png"],
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
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('mtb_theme') || 'light';
                  var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-white text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
