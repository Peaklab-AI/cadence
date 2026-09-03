import { Card, Tag } from "@peaklab/ui";
import { Link as RouterLink } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import type { ArticleMetadata } from "../data/articleData";
import styles from "./ArticleCard.module.css";

export function ArticleCard({ article }: { article: ArticleMetadata }) {
  return (
    <RouterLink to={`/articles/${article.slug}`} className={styles.link}>
      <Card tone="default" interactive padding={30} radius="var(--plu-radius-xl)" className={styles.card}>
        <div className={styles.content}>
          <h3 className={styles.title}>{article.title}</h3>
          <div className={styles.tagRow}>
            <Tag tone="neutral" size="sm">
              {article.category}
            </Tag>
          </div>
          <p className={styles.summary}>{article.summary}</p>
          <div className={styles.footer}>
            <span className={styles.readingTime}>
              <Clock size={14} />
              {article.readingTime}
            </span>
            <span className={styles.arrowBadge} aria-hidden="true">
              <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </Card>
    </RouterLink>
  );
}
