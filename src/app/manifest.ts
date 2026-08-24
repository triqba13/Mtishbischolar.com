import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MtishbiScholar — Study Abroad & University Admissions",
    short_name: "MtishbiScholar",
    description:
      "Platform helping Tanzanian students discover international universities, scholarships, and university admission opportunities.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0B192C",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/logo.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
