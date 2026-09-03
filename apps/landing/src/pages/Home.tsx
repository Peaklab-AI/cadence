import { Hero } from "../components/Hero";
import { ProofPoints } from "../components/ProofPoints";
import { Features } from "../components/Features";
import { FAQ } from "../components/FAQ";
import { ClosingCTA } from "../components/ClosingCTA";

/**
 * Section backgrounds alternate per DESIGN.md §6's convention:
 * page (Hero/ProofPoints) -> mint-wash (Features) -> page (FAQ) ->
 * gradient-brand (ClosingCTA).
 */
export function Home() {
  return (
    <>
      <Hero />
      <ProofPoints />
      <Features />
      <FAQ />
      <ClosingCTA />
    </>
  );
}
