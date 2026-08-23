import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "International Universities for Tanzanian Students",
  description:
    "Explore top international universities and discover study abroad opportunities suitable for Tanzanian students across India, UK, Poland, and worldwide destinations.",
  alternates: {
    canonical: "/destinations",
  },
  openGraph: {
    title: "International Universities for Tanzanian Students | MtishbiScholar",
    description:
      "Explore international universities and study abroad destinations tailored for Tanzanian students.",
    url: "/destinations",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "International Universities for Tanzanian Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "International Universities for Tanzanian Students | MtishbiScholar",
    description:
      "Explore international universities and study destinations tailored for Tanzanian students.",
    images: ["/og-image.png"],
  },
};

export default function DestinationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
