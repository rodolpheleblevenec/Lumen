import {
  BookOpen,
  Coins,
  FlaskConical,
  Globe,
  Landmark,
  Lightbulb,
  Palette,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/** Paires couleur + fond soft, en rotation indigo / teal / corail / vert. */
export const DOMAIN_HUES = [
  { color: "var(--primary)", soft: "var(--primary-soft)" },
  { color: "var(--teal)", soft: "var(--teal-soft)" },
  { color: "var(--accent)", soft: "var(--accent-soft)" },
  { color: "var(--green)", soft: "var(--green-soft)" },
] as const;

// Clés = noms exacts de lumen_domain_calendar
const DOMAIN_STYLES: Record<string, { Icon: LucideIcon; hue: number }> = {
  Histoire: { Icon: Landmark, hue: 0 },
  "Sciences & nature": { Icon: FlaskConical, hue: 1 },
  "Arts & littérature": { Icon: Palette, hue: 2 },
  "Géopolitique & monde contemporain": { Icon: Globe, hue: 3 },
  "Philosophie & idées": { Icon: Lightbulb, hue: 0 },
  "Économie & société": { Icon: Coins, hue: 1 },
  "Carte blanche": { Icon: Sparkles, hue: 2 },
};

export function domainStyle(domain: string) {
  const entry = DOMAIN_STYLES[domain] ?? { Icon: BookOpen, hue: 0 };
  return { Icon: entry.Icon, ...DOMAIN_HUES[entry.hue] };
}

/** Pastille ronde de domaine (bibliothèque). */
export function DomainDot({ domain, size = 44 }: { domain: string; size?: number }) {
  const { Icon, color, soft } = domainStyle(domain);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: soft, color }}
      aria-hidden
    >
      <Icon size={20} strokeWidth={1.9} />
    </span>
  );
}
