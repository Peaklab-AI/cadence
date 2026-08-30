import { Accordion, Container, SectionHeader } from "@peaklab/ui";
import styles from "./FAQ.module.css";

/**
 * Every answer restates a fact already stated elsewhere on this page (Hero,
 * ProofPoints, Features, Footer, ClosingCTA) rather than introducing new
 * marketing copy, matching Features.tsx/ProofPoints.tsx's sourcing rule.
 */
const FAQS = [
  {
    question: "Is Cadence free?",
    answer: "Yes. Cadence is free and open source — no purchase, no license key. The full source is on GitHub.",
  },
  {
    question: "What platforms does Cadence support?",
    answer: "Cadence is a native macOS app, built for macOS 13+. It's not a wrapped web app.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "Everything stays on your Mac. There's no account and no server — your projects and hours live in a single file you control.",
  },
  {
    question: "How does weekly billing work?",
    answer:
      "Every week's tracked time rolls into one total. Once you've sent the invoice, you mark that week billed, so what's invoiced is never a guess.",
  },
  {
    question: "Can I export reports?",
    answer: "Yes. Generate an itemized PDF report for any date range, filterable by client or project.",
  },
  {
    question: "How do I install it?",
    answer: "Paste the install command into Terminal. It installs Cadence to /Applications and launches it.",
  },
];

const FAQ_ITEMS = FAQS.map((faq, index) => ({
  id: `faq-${index}`,
  title: faq.question,
  content: faq.answer,
}));

// Derived from FAQS so the rich-result markup can't drift from the visible copy.
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export function FAQ() {
  return (
    <section id="faq" className={styles.section}>
      <Container size="max">
        <SectionHeader title="Frequently asked questions" />
        <Accordion items={FAQ_ITEMS} className={styles.accordion} />
      </Container>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
    </section>
  );
}
