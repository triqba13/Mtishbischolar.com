import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://mtishbischolar.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin/*",
          "/student/",
          "/student/*",
          "/api/",
          "/api/*",
          "/auth/",
          "/auth/*",
        ],
      },
    ],
    sitemap: `${baseUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
