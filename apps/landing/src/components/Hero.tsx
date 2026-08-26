import { AnimatedBackground, Container, Text, Title } from "@peaklab/ui";
import appStyles from "../App.module.css";
import heroStyles from "./Hero.module.css";
import { GithubIcon } from "./icons";
import { InstallCommand } from "./InstallCommand";
import { Mockup } from "./Mockup";

/**
 * Owns its own AnimatedBackground (rather than App.tsx wrapping it in
 * GradientBackground) so the glow-behind-headline layering can share one
 * stacking context with the beams, per agency's AnimatedHero.tsx pattern.
 * `background="sky"` is required, not optional — AnimatedBackground's beams
 * render in fixed white (`--plu-shape-color`, see DESIGN.md §6), so without
 * a tinted wash behind them they're white-on-paper and effectively
 * invisible. Cadence's own app icon is a blue/cyan/purple sweep (see
 * CadenceMark in NavBar.tsx), so the sky wash reads as on-brand, not foreign.
 */
export function Hero() {
  return (
    <section className={heroStyles.heroTop}>
      <AnimatedBackground grid background="sky" />
      <Container as="div" size="max" gutter className={appStyles.heroSection}>
        <div className={appStyles.heroGrid}>
          <div className={appStyles.heroCopy}>
            <div className={`${heroStyles.titleGlow} ${heroStyles.stacked}`}>
              <Title
                as="h1"
                variant="hero"
                wrap="pretty"
                className={`${heroStyles.heroTitle} ${heroStyles.stacked}`}
              >
                A simple, free and open source time tracker.
              </Title>
            </div>

            <Text
              as="p"
              variant="lead"
              wrap="pretty"
              className={`${appStyles.leadText} ${heroStyles.stacked}`}
            >
              Track time against a project. Every week, Cadence groups it into a total you can check off once
              you&rsquo;ve sent the invoice, so what&rsquo;s billed and what isn&rsquo;t is never a guess.
            </Text>

            <div className={`${appStyles.ctaRow} ${heroStyles.stacked}`}>
              <InstallCommand />
            </div>

            <Text as="p" variant="small" className={`${appStyles.factLine} ${heroStyles.stacked}`}>
              Paste into Terminal. Installs to /Applications and launches Cadence.
            </Text>

            <a
              className={`${appStyles.githubLink} ${heroStyles.stacked}`}
              href="https://github.com/Peaklab-AI/cadence"
              target="_blank"
              rel="noopener"
            >
              <GithubIcon size={16} />
              Cadence is open source. View it on GitHub
            </a>
          </div>

          <div className={`${appStyles.heroMockupWrap} ${heroStyles.stacked}`}>
            <Mockup />
          </div>
        </div>
      </Container>
    </section>
  );
}
