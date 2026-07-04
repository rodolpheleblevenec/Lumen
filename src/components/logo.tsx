/** Marque « Le Levant » : soleil se levant sur l'horizon. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 15a6 6 0 0 1 12 0Z" fill="var(--accent)" />
      <path
        d="M3.5 15h17"
        stroke="var(--primary)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 4.2v2.3M5.8 6.8l1.7 1.7M18.2 6.8l-1.7 1.7"
        stroke="var(--primary)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Variante tuile (login) : marque crème + demi-cercle corail sur fond indigo. */
export function LogoTile({ size = 88 }: { size?: number }) {
  return (
    <span
      className="push-cta-primary flex items-center justify-center rounded-3xl bg-primary"
      style={{ width: size, height: size, boxShadow: "0 6px 0 var(--primary-shadow)" }}
      aria-hidden
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M6 15a6 6 0 0 1 12 0Z" fill="var(--accent)" />
        <path d="M3.5 15h17" stroke="#f6f3ec" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M12 4.2v2.3M5.8 6.8l1.7 1.7M18.2 6.8l-1.7 1.7"
          stroke="#f6f3ec"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
