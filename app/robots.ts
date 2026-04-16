import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/auth", "/upgrade", "/api/", "/w/"],
      },
    ],
    sitemap: "https://www.ristoagent.com/sitemap.xml",
  };
}
