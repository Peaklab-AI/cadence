import { Text, Title } from "@peaklab/ui";
import styles from "./ClosingCTA.module.css";
import { GithubIcon } from "./icons";
import { InstallCommand } from "./InstallCommand";

/**
 * Full-bleed closing CTA. Matches agency's actual ClosingCTA.module.css:
 * `background: var(--plu-gradient-brand)` applied directly to a plain
 * `.card` div, not the `GradientBackground` *component* — that component
 * renders a much softer, near-white ambient mesh meant to sit behind other
 * content, not stand in for the flat brand-gradient token. `--plu-gradient
 * -brand` itself is a light mint/sky/olive pastel (see tokens.css), so text
 * on it stays dark ink, same as agency's card — not inverse/white.
 */
export function ClosingCTA() {
  return (
    <section id="install" className={styles.section}>
      <div className={styles.card}>
        <Title as="h2" variant="section">
          Install Cadence
        </Title>
        <Text variant="lead" className={styles.body}>
          Paste into Terminal. Installs to /Applications and launches Cadence.
        </Text>
        <div className={styles.actions}>
          <InstallCommand />
        </div>
        <a className={styles.githubLink} href="https://github.com/Peaklab-AI/cadence" target="_blank" rel="noopener">
          <GithubIcon size={16} />
          Cadence is open source. View it on GitHub
        </a>
      </div>
    </section>
  );
}
