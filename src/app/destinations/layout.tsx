import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "International Universities for Tanzanian Students",
  description:
    "Explore international study destinations and university opportunities for Tanzanian students with MtishbiScholar.",
  alternates: {
    canonical: "/destinations",
  },
  openGraph: {
    title: "International Universities for Tanzanian Students | MtishbiScholar",
    description:
      "Explore international study destinations and university opportunities for Tanzanian students with MtishbiScholar.",
    url: "/destinations",
    type: "website",
    images: [
      {
        url: "/logo.jpeg",
        alt: "Mtishbi Scholars official logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "International Universities for Tanzanian Students | MtishbiScholar",
    description:
      "Explore international universities and study destinations tailored for Tanzanian students.",
    images: ["/logo.jpeg"],
  },
};

export default function DestinationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
