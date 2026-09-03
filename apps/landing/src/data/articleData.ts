/**
 * Article metadata, most-recent-first. Prose fields (title/summary/etc.) are
 * inline here rather than pulled from a JSON i18n file — unlike agency,
 * Cadence has no i18n/messagify tooling that would consume that indirection
 * (see docs/plans/articles-page.md, Decision 3).
 */
export interface ArticleMetadata {
  slug: string;
  title: string;
  summary: string;
  metaDescription: string;
  readingTime: string;
  category: string;
  publishedDate: string;
}

const articleList: ArticleMetadata[] = [
  {
    slug: "why-cadence-is-free",
    title: "Why Cadence Is Free",
    summary:
      "A time tracker doesn't need a server, a subscription, or a growth team. Here's why we built Cadence as a free, one-time download instead.",
    metaDescription:
      "Cadence is free and open source, not freemium. Why peaklab builds small, useful tools like this instead of turning every side project into a SaaS.",
    readingTime: "4 min read",
    category: "Product",
    publishedDate: "2026-09-04",
  },
  {
    slug: "local-first-no-account-software",
    title: "The Case for Local-First, No-Account Software",
    summary:
      "No sign-up, no server, no data leaving your Mac. What you give up by skipping the cloud, and what you get back.",
    metaDescription:
      "Why local-first software like Cadence — no account, no server, everything in one file on your Mac — is worth the trade-offs for tools you use every day.",
    readingTime: "5 min read",
    category: "Privacy",
    publishedDate: "2026-09-04",
  },
  {
    slug: "billing-clients-on-time",
    title: "A Simple System for Billing Clients on Time",
    summary:
      "Track, group, mark billed. A three-step workflow that keeps freelance invoicing from turning into a monthly scramble.",
    metaDescription:
      "A simple freelance billing workflow: track time against a project, group it into a week, mark it billed once you've invoiced — no spreadsheet required.",
    readingTime: "5 min read",
    category: "Freelancing",
    publishedDate: "2026-09-04",
  },
];

export const articles: ArticleMetadata[] = [...articleList].sort((a, b) =>
  b.publishedDate.localeCompare(a.publishedDate),
);
