import { useEffect, useRef } from "react";
import { NavBar as PlNavBar } from "@peaklab/ui";
import { CadenceMark } from "./icons";
import styles from "./NavBar.module.css";

const GITHUB_URL = "https://github.com/Peaklab-AI/cadence";

const SPIN_MAX_DEG_PER_MS = 360 / 700;
const SPIN_RAMP_MS = 220;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Drives the logo mark's rotation via rAF instead of a CSS animation so hover
 * enter/leave ramps velocity up or down (SPIN_RAMP_MS) rather than snapping
 * the spin fully on/off.
 */
function useSpinOnHover(markRef: React.RefObject<HTMLElement | null>) {
  const angle = useRef(0);
  const velocity = useRef(0);
  const targetVelocity = useRef(0);
  const lastFrame = useRef(0);
  const rafId = useRef<number | undefined>(undefined);

  const tick = (time: number) => {
    const dt = lastFrame.current ? time - lastFrame.current : 0;
    lastFrame.current = time;

    const smoothing = 1 - Math.exp(-dt / SPIN_RAMP_MS);
    velocity.current += (targetVelocity.current - velocity.current) * smoothing;
    angle.current = (angle.current + velocity.current * dt) % 360;

    const mark = markRef.current;
    if (mark) mark.style.transform = `rotate(${angle.current}deg)`;

    if (targetVelocity.current !== 0 || Math.abs(velocity.current) > 0.001) {
      rafId.current = requestAnimationFrame(tick);
    } else {
      velocity.current = 0;
      rafId.current = undefined;
    }
  };

  const ensureLoop = () => {
    if (rafId.current === undefined) {
      lastFrame.current = 0;
      rafId.current = requestAnimationFrame(tick);
    }
  };

  useEffect(() => {
    return () => {
      if (rafId.current !== undefined) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return {
    onMouseEnter: () => {
      targetVelocity.current = SPIN_MAX_DEG_PER_MS;
      ensureLoop();
    },
    onMouseLeave: () => {
      targetVelocity.current = 0;
      ensureLoop();
    },
  };
}

/**
 * Floating NavBar for a single-page site — no react-router, unlike agency's
 * SiteNavBar. `onNavigate` branches on the clicked label directly and either
 * scrolls to a section or opens the GitHub repo. Reserves `--site-nav-height`
 * via ResizeObserver so Hero can clear the fixed bar without a hardcoded
 * offset, same pattern as agency's SiteNavBar.tsx.
 */
export function NavBar() {
  const headerRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const spinHandlers = useSpinOnHover(markRef);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      document.documentElement.style.setProperty("--site-nav-height", `${entry.target.getBoundingClientRect().height}px`);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <PlNavBar
      ref={headerRef}
      floating
      logo={
        <span className={styles.logo} onMouseEnter={spinHandlers.onMouseEnter} onMouseLeave={spinHandlers.onMouseLeave}>
          <span className={styles.mark} ref={markRef}>
            <CadenceMark size={28} />
          </span>
          Cadence
        </span>
      }
      items={["Features", "FAQ", "Install"]}
      ctaLabel="Install"
      ctaTarget="Install"
      secondaryLabel="GitHub"
      secondaryTarget="GitHub"
      onNavigate={(target) => {
        if (target === "Features") scrollToId("features");
        else if (target === "FAQ") scrollToId("faq");
        else if (target === "Install") scrollToId("install");
        else if (target === "GitHub") window.open(GITHUB_URL, "_blank", "noopener");
      }}
    />
  );
}
