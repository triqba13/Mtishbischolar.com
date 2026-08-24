import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "International Universities for Tanzanian Students",
  description:
    "Explore international study destinations and university opportunities for Tanzanian students with MtishbiScholars.",
  alternates: {
    canonical: "/destinations",
  },
  openGraph: {
    title: "International Universities for Tanzanian Students | MtishbiScholars",
    description:
      "Explore international study destinations and university opportunities for Tanzanian students with MtishbiScholars.",
    url: "/destinations",
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
    title: "International Universities for Tanzanian Students | MtishbiScholars",
    description:
      "Explore international universities and study destinations tailored for Tanzanian students.",
    images: ["/logo.png"],
  },
};

export default function DestinationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
