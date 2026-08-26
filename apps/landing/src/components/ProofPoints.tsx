import { Container, ProofPoint } from "@peaklab/ui";
import styles from "./ProofPoints.module.css";

/**
 * Flat strip directly under the hero, matching agency's AnimatedHero
 * proof-points band. Every point restates a fact already stated elsewhere in
 * this repo — none of this is new marketing copy:
 * - "Free & open source": index.html's JSON-LD `offers.price: "0"` plus the
 *   hero's existing GitHub link/copy.
 * - "Native macOS app": index.html's existing OG/meta description.
 * - "No account, no server" / "Everything in one file": today's Footer copy.
 */
const POINTS = [
  { title: "Free & open source", body: "No purchase, no license key. The full source is on GitHub." },
  { title: "Native macOS app", body: "Built for macOS 13+, not a wrapped web app." },
  { title: "No account, no server", body: "Nothing about your work leaves your Mac." },
  { title: "Everything in one file", body: "Your projects and hours live in a single file you control." },
];

export function ProofPoints() {
  return (
    <section className={styles.section}>
      <Container size="max" className={styles.grid}>
        {POINTS.map((point) => (
          <ProofPoint key={point.title} title={point.title} body={point.body} />
        ))}
      </Container>
    </section>
  );
}
