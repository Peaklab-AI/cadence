import { Container, Logo, Text } from "@peaklab/ui";
import appStyles from "../App.module.css";
import { DiscordIcon } from "./icons";

/**
 * Hand-assembled from Container/Text primitives rather than @peaklab/ui's
 * `Footer` — that component's contract (logo + description + columns of
 * static href="#" nav links) has no slot for a live Discord link or the
 * peakLab credit link. See docs/plans/landing-page-peaklab-ui-refactor.md.
 *
 * Two-tier layout (main row + a separated legal bar) matches agency's
 * SiteFooter.tsx pattern, restyled onto the same content as before.
 *
 * The peakLab credit uses peaklab-ui's own `Logo` (variant="lockup-light")
 * rather than a hand-copied mark + text wordmark, so it always tracks
 * peaklab-ui's current brand gradient instead of drifting out of sync on
 * rebrands, and the "peakLab" wordmark renders as real SVG glyph paths
 * instead of text (avoids inheriting the page's font/underline).
 */
export function Footer() {
  return (
    <footer>
      <Container as="div" size="max" gutter className={appStyles.footerSection}>
        <div className={appStyles.footerRow}>
          <Text as="p" variant="small">
            Cadence keeps everything in one file on your Mac, with no account, no server, nothing tracked but your
            own hours.
          </Text>

          <a className={appStyles.discordCta} href="https://discord.gg/K8SAABhaQ" target="_blank" rel="noopener">
            <DiscordIcon size={16} />
            Chat with us on Discord
          </a>

          <span className={appStyles.peaklabCredit}>
            <span className={appStyles.peaklabCreditLabel}>Developed by</span>
            <a className={appStyles.peaklabLink} href="https://peaklab.ai" target="_blank" rel="noopener">
              <Logo variant="lockup-light" height={24} />
            </a>
          </span>
        </div>
      </Container>

      <div className={appStyles.legalBar}>
        <Container size="max" className={appStyles.legalInner}>
          <Text as="p" variant="small" className={appStyles.footerMeta}>
            © 2026 PEAKLAB LIMITED. All rights reserved.
          </Text>
        </Container>
      </div>
    </footer>
  );
}
