"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Easter egg : un appui long (~550 ms) sur la marque révèle combien de
 * notions dorment dans ta mémoire.
 */
export function LogoSecret({
  acquired,
  children,
}: {
  acquired: number;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  function press() {
    pressTimer.current = setTimeout(() => {
      setShow(true);
      try {
        navigator.vibrate?.(15);
      } catch {
        /* tant pis */
      }
      hideTimer.current = setTimeout(() => setShow(false), 2600);
    }, 550);
  }

  function release() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  return (
    <span
      className="relative inline-flex select-none"
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
      {show && (
        <span className="animate-fade-up shadow-nav absolute left-0 top-full z-40 mt-2 w-max max-w-[240px] rounded-2xl bg-primary px-3.5 py-2 text-xs font-medium text-white">
          {acquired > 0
            ? `${acquired} notion${acquired > 1 ? "s" : ""} dor${acquired > 1 ? "ment" : "t"} dans ta mémoire.`
            : "Ta mémoire s'échauffe : les premières notions arrivent."}
        </span>
      )}
    </span>
  );
}
