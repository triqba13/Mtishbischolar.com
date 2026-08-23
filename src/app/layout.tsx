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

export const metadata: Metadata = {
  title: "MtishbiScholar — Your Pathway to Global Education",
  description:
    "MtishbiScholar is Tanzania's leading study-abroad platform. We help students achieve international education goals through university admissions, scholarships, visa support, and expert guidance.",
  keywords: [
    "study abroad Tanzania",
    "university admission",
    "scholarships",
    "international education",
    "MtishbiScholar",
    "study in UK",
    "study in India",
    "study in China",
  ],
  openGraph: {
    title: "MtishbiScholar  Your Pathway to Global Education",
    description:
      "Tanzania's leading study-abroad platform. University admissions, scholarships & visa support.",
    type: "website",
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
