import { Container, SectionHeader, ServiceCard } from "@peaklab/ui";
import { CalendarIcon, FileTextIcon, TimerIcon, UsersIcon } from "./icons";
import styles from "./Features.module.css";

/**
 * Capabilities, not process — replaces the old "How it works" 3-step
 * walkthrough. Each card restates a real capability already documented
 * elsewhere in this repo (the hero/history-panel copy, or a Done plan under
 * docs/plans/), not invented marketing claims.
 */
const FEATURES = [
  {
    title: "Per-project timers",
    body: "Start a timer against a project. Cadence keeps every hour attached to it.",
    icon: <TimerIcon />,
  },
  {
    title: "Weekly billing groups",
    body: "Every week's tracked time rolls into one total you mark billed, so what's invoiced is never a guess.",
    icon: <CalendarIcon />,
  },
  {
    title: "Grouped by client",
    body: "History is organized by client, with a running unbilled total per currency across all of their projects.",
    icon: <UsersIcon />,
  },
  {
    title: "PDF reports, any range",
    body: "Generate an itemized report for a date range, filterable by client or project.",
    icon: <FileTextIcon />,
  },
];

export function Features() {
  return (
    <section id="features" className={styles.section}>
      <Container size="max">
        <SectionHeader title="Features" subtitle="What Cadence actually does." />
        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <ServiceCard
              key={feature.title}
              title={feature.title}
              body={feature.body}
              icon={feature.icon}
              cta={false}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
