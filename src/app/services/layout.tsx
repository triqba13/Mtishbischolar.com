import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "University Admissions & Visa Support for Tanzanian Students",
  description:
    "Comprehensive study abroad services for Tanzanian students: university admissions, scholarship guidance, visa processing, passport support, and document management.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "University Admissions & Visa Support for Tanzanian Students | MtishbiScholar",
    description:
      "Comprehensive study abroad services for Tanzanian students including university admissions, scholarship guidance, and visa support.",
    url: "/services",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "University Admissions & Visa Support for Tanzanian Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "University Admissions & Visa Support | MtishbiScholar",
    description:
      "Discover full-cycle study abroad services from university admissions to visa processing for Tanzanian students.",
    images: ["/og-image.png"],
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
