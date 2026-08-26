import { useEffect, useRef, useState } from "react";
import styles from "./InstallCommand.module.css";
import { CopyIcon, CheckIcon } from "./icons";

const INSTALL_COMMAND = "curl -fsSL https://cadence.peaklab.ai/install.sh | bash";

/** Terminal-style pill with a copy-to-clipboard button; mirrors the previous vanilla-JS behavior 1:1. */
export function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
    } catch {
      // Clipboard access can be denied (permissions, insecure context); the
      // command text is still selectable/readable, so fail silently.
      return;
    }
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={styles.pill} role="group" aria-label="Install command">
      <span className={styles.prompt} aria-hidden="true">
        $
      </span>
      <code className={styles.command}>{INSTALL_COMMAND}</code>
      <button
        type="button"
        className={styles.copyButton}
        data-copied={copied || undefined}
        aria-label="Copy install command"
        onClick={handleCopy}
      >
        <span className={styles.iconSwap} data-show={copied ? "check" : "copy"}>
          <span className={styles.copyIcon}>
            <CopyIcon size={14} />
          </span>
          <span className={styles.checkIcon}>
            <CheckIcon size={14} />
          </span>
        </span>
      </button>
    </div>
  );
}
