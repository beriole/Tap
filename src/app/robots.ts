import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * §13 - Indexation configurable. Les espaces authentifies et les endpoints
 * techniques ne sont jamais indexes ; les profils publics le sont au cas par
 * cas selon Profile.seoIndexable, via la balise robots de chaque page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/admin/", "/api/", "/card-unavailable"],
    },
    host: siteConfig.url,
  };
}
