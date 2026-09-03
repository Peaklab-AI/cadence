import { Container, SectionHeader } from "@peaklab/ui";
import { articles } from "../data/articleData";
import { ArticleCard } from "../components/ArticleCard";
import { ClosingCTA } from "../components/ClosingCTA";
import { SEO } from "../components/SEO";
import styles from "./Articles.module.css";

export function Articles() {
  return (
    <div className={styles.page}>
      <SEO
        title="Articles"
        description="Notes on time tracking, freelance billing, and building small, free software — from the team behind Cadence."
        canonical="/articles"
      />

      <Container size="max">
        <SectionHeader title="Articles" subtitle="Notes on time tracking, billing, and building small software." />

        <div className={styles.grid}>
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </Container>

      <ClosingCTA />
    </div>
  );
}
