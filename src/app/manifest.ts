import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MtishbiScholars: Study Abroad & University Admissions",
    short_name: "MtishbiScholars",
    description:
      "Platform helping Tanzanian students discover international universities, scholarships, and university admission opportunities.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0B192C",
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
