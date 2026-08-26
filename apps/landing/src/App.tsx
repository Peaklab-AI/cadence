import styles from "./App.module.css";
import { NavBar } from "./components/NavBar";
import { Hero } from "./components/Hero";
import { ProofPoints } from "./components/ProofPoints";
import { Features } from "./components/Features";
import { FAQ } from "./components/FAQ";
import { ClosingCTA } from "./components/ClosingCTA";
import { Footer } from "./components/Footer";

/**
 * Section backgrounds alternate per DESIGN.md §6's convention:
 * page (Hero/ProofPoints) -> mint-wash (Features) -> page (FAQ) ->
 * gradient-brand (ClosingCTA) -> page (Footer).
 */
export function App() {
  return (
    <div className={styles.page}>
      <NavBar />
      <Hero />
      <ProofPoints />
      <Features />
      <FAQ />
      <ClosingCTA />
      <Footer />
    </div>
  );
}
