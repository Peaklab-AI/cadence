import { useEffect, useRef, type RefObject } from "react";

/** Calls `onOutsideClick` when a mousedown lands outside `ref`, while `active`. */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
  onOutsideClick: () => void,
) {
  const handlerRef = useRef(onOutsideClick);
  useEffect(() => {
    handlerRef.current = onOutsideClick;
  });

  useEffect(() => {
    if (!active) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handlerRef.current();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [active, ref]);
}
