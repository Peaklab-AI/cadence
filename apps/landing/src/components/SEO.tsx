import { Helmet } from "react-helmet-async";

const SITE_NAME = "Cadence";
const BASE_URL = "https://cadence.peaklab.ai";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og.png`;

interface SEOProps {
  title: string;
  description: string;
  /** Path only, e.g. "/articles" — joined with BASE_URL below. */
  canonical: string;
  ogType?: "website" | "article";
  articleData?: {
    publishedTime?: string;
    author?: string;
    category?: string;
  };
}

/**
 * Client-side-only meta tags (react-helmet-async updates <title>/<meta>
 * after JS runs) — no build-time prerendering. Cadence is a plain static
 * Vite SPA with no server, unlike agency's Express-rendered pages; see
 * docs/plans/articles-page.md, Decision 2.
 */
export function SEO({ title, description, canonical, ogType = "website", articleData }: SEOProps) {
  const fullTitle = title.endsWith(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const url = `${BASE_URL}${canonical}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={url} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

      {ogType === "article" && articleData?.publishedTime && (
        <meta property="article:published_time" content={articleData.publishedTime} />
      )}
      {ogType === "article" && articleData?.author && (
        <meta property="article:author" content={articleData.author} />
      )}
      {ogType === "article" && articleData?.category && (
        <meta property="article:section" content={articleData.category} />
      )}

      {ogType === "article" && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: fullTitle,
            description,
            url,
            image: DEFAULT_OG_IMAGE,
            datePublished: articleData?.publishedTime,
            author: { "@type": "Organization", name: articleData?.author ?? "peakLab" },
            publisher: {
              "@type": "Organization",
              name: SITE_NAME,
              logo: { "@type": "ImageObject", url: `${BASE_URL}/apple-touch-icon.png` },
            },
          })}
        </script>
      )}
    </Helmet>
  );
}
