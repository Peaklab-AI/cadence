import { Card, Tag, Badge } from "@peaklab/ui";
import styles from "./Mockup.module.css";
import { CadenceMark, CheckIcon, PauseIcon } from "./icons";

/**
 * A faithful reproduction of three real Cadence surfaces — the Tracker card,
 * the History card, and a generated PDF report — not invented marketing art,
 * per docs/plans/landing-page-peaklab-ui-refactor.md. Tracker/History are
 * built from Card/Tag/Badge + tokens. The report screen is deliberately
 * NOT a Card: it copies the actual colors/layout `buildTimeLogPdf` in
 * ../../../../src/lib/pdfReport.ts draws with jsPDF/autotable (white page,
 * left-logo/right-title letterhead, #334155 dark table header with white
 * text, #e2e8f0 total row, gray footer with the site link + page number) —
 * see docs/plans/pdf-report-branding-and-layout.md for the branding fields
 * it mirrors. Those are hardcoded hex values, not --plu-* tokens: a PDF
 * page's colors are fixed regardless of the site's theme, unlike an
 * in-app surface.
 *
 * Each screen is wrapped in a `.screen` element (Mockup.module.css) that
 * applies the fanned tilt independently of Card's own mount transform,
 * since Card is a `motion.div` that manages its own inline `transform` for
 * its fade/slide-in and would otherwise clobber a rotation applied
 * directly to it.
 *
 * The report's per-day figures are deliberately consistent with the History
 * card above it — same $100/hr rate implied by $1,650.00 / 16.5h — so a
 * reader who checks the math across cards finds it holds up.
 */
export function Mockup() {
  return (
    <div className={styles.stack}>
      <div className={`${styles.screen} ${styles.screenTracker}`}>
        <Card
          tone="default"
          padding={20}
          role="img"
          aria-label="Cadence timer tracking 2 hours 14 minutes on Website Redesign for Acme Co"
        >
          <div className={styles.statusRow}>
            <span className={styles.statusDotWrap} aria-hidden="true">
              <span className={styles.statusDotPing} />
              <span className={styles.statusDot} />
            </span>
            <span className={styles.statusLabel}>Tracking</span>
          </div>

          <div className={styles.timerRow}>
            <span className={styles.timer}>2:14:08</span>
            <span className={styles.pauseGlyph} aria-hidden="true">
              <PauseIcon size={16} />
            </span>
          </div>

          <div className={styles.divider} />

          <div className={styles.projectRow}>
            <span className={styles.projectCheck} aria-hidden="true">
              <CheckIcon size={10} />
            </span>
            <span className={styles.projectText}>
              <span className={styles.projectName}>Website Redesign</span>
              <span className={styles.projectClient}>Acme Co</span>
            </span>
            <Tag tone="sky">Hourly</Tag>
          </div>
        </Card>
      </div>

      <div className={`${styles.screen} ${styles.screenHistory}`}>
        <Card
          tone="default"
          padding={20}
          role="img"
          aria-label="History showing the week of July 14 to 20, 16 hours 30 minutes, 1650 dollars, marked Billed with invoice INV-1024"
        >
          <div className={styles.historyHead}>
            <span className={styles.projectName}>Website Redesign</span>
            <Tag tone="sky">Hourly</Tag>
          </div>
          <p className={styles.historyClient}>Acme Co</p>
          <div className={styles.historyRow}>
            <span className={styles.historyWeek}>Jul 14 to Jul 20</span>
            <span className={styles.historyFigures}>
              <span className={styles.historyDuration}>16h 30m</span>
              <span className={styles.historyAmount}>$1,650.00</span>
            </span>
          </div>
          <Badge variant="subtle" colorScheme="success" size="sm">
            <span className={styles.billedTag}>
              <CheckIcon size={11} />
              Billed · INV-1024
            </span>
          </Badge>
        </Card>
      </div>

      <div className={`${styles.screen} ${styles.screenReport}`}>
        <div
          className={styles.page}
          role="img"
          aria-label="Generated PDF time report for Acme Co — Website Redesign, week of July 14 to 20, itemized by day totaling 16 hours 30 minutes and 1650 dollars"
        >
          <div className={styles.pageHeader}>
            <span className={styles.pageLogo} aria-hidden="true">
              <CadenceMark size={22} />
            </span>
            <span className={styles.pageHeadText}>
              <span className={styles.pageTitle}>Time report</span>
              <span className={styles.pageRange}>Jul 14 – Jul 20, 2026</span>
            </span>
          </div>

          <p className={styles.pageSection}>Acme Co — Website Redesign</p>

          <div className={styles.pageTable}>
            <div className={`${styles.pageRow} ${styles.pageRowHead}`}>
              <span>Date</span>
              <span>Start</span>
              <span>End</span>
              <span className={styles.alignRight}>Amount</span>
              <span className={styles.alignRight}>Duration</span>
            </div>
            <div className={styles.pageRow}>
              <span>Jul 14</span>
              <span>9:02 AM</span>
              <span>12:12 PM</span>
              <span className={styles.alignRight}>$316.67</span>
              <span className={styles.alignRight}>3h 10m</span>
            </div>
            <div className={`${styles.pageRow} ${styles.pageRowAlt}`}>
              <span>Jul 15</span>
              <span>9:15 AM</span>
              <span>12:00 PM</span>
              <span className={styles.alignRight}>$275.00</span>
              <span className={styles.alignRight}>2h 45m</span>
            </div>
            <div className={styles.pageRow}>
              <span>Jul 16</span>
              <span>8:50 AM</span>
              <span>12:55 PM</span>
              <span className={styles.alignRight}>$408.33</span>
              <span className={styles.alignRight}>4h 05m</span>
            </div>
            <div className={`${styles.pageRow} ${styles.pageRowAlt} ${styles.pageRowEllipsis}`}>
              <span className={styles.pageEllipsis}>···</span>
            </div>
            <div className={`${styles.pageRow} ${styles.pageRowFoot}`}>
              <span>Total</span>
              <span />
              <span />
              <span className={styles.alignRight}>$1,650.00</span>
              <span className={styles.alignRight}>16h 30m</span>
            </div>
          </div>

          <div className={styles.pageFooter}>
            <span>Generated using cadence.peaklab.ai</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
