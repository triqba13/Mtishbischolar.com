import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "University Admissions & Visa Support for Tanzanian Students",
  description:
    "Get study abroad support from university selection and applications to scholarships, visa guidance, documents, and pre-departure assistance.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "University Admissions & Visa Support for Tanzanian Students | MtishbiScholars",
    description:
      "Get study abroad support from university selection and applications to scholarships, visa guidance, documents, and pre-departure assistance.",
    url: "/services",
    type: "website",
    images: [
      {
        url: "/logo.png",
        alt: "Mtishbi Scholars official logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "University Admissions & Visa Support | MtishbiScholars",
    description:
      "Discover full-cycle study abroad services from university admissions to visa processing for Tanzanian students.",
    images: ["/logo.png"],
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
