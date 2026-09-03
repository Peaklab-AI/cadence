import { lazy, Suspense, useMemo } from "react";
import { Link as RouterLink, Navigate, useParams } from "react-router-dom";
import { Container, Tag, Title } from "@peaklab/ui";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { articles } from "../data/articleData";
import { ClosingCTA } from "../components/ClosingCTA";
import { SEO } from "../components/SEO";
import styles from "./ArticleDetail.module.css";

export function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const article = articles.find((a) => a.slug === slug);
  const formattedDate = article
    ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(
        new Date(article.publishedDate),
      )
    : "";

  // Dynamically loaded per slug so navigating between two article routes
  // (which re-renders this component rather than remounting it, since both
  // match the same /articles/:slug route) picks up the new content instead
  // of holding onto a stale lazy() reference.
  const Content = useMemo(() => lazy(() => import(`../content/articles/${slug}.tsx`)), [slug]);

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <div key={slug} className={styles.page}>
      <SEO
        title={article.title}
        description={article.metaDescription}
        canonical={`/articles/${article.slug}`}
        ogType="article"
        articleData={{
          category: article.category,
          author: "peakLab",
          publishedTime: article.publishedDate,
        }}
      />

      <Container size="max">
        <RouterLink to="/articles" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to articles
        </RouterLink>

        <header>
          <Title as="h1" variant="none" className={styles.title}>
            {article.title}
          </Title>
          <p className={styles.summary}>{article.summary}</p>

          <div className={styles.metaRow}>
            <Tag tone="neutral" size="sm">
              {article.category}
            </Tag>
            <span className={styles.metaBadge}>
              <Clock size={13} />
              {article.readingTime}
            </span>
            <span className={styles.metaBadge}>
              <Calendar size={13} />
              {formattedDate}
            </span>
          </div>
        </header>

        <div className={styles.body}>
          <Suspense fallback={null}>
            <Content />
          </Suspense>
        </div>
      </Container>

      <div className={styles.footer}>
        <ClosingCTA />
      </div>
    </div>
  );
}
