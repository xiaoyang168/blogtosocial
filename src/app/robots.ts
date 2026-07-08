import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/sign-in", "/sign-up"],
    },
    sitemap: "https://www.blogtosocial.top/sitemap.xml",
  };
}
