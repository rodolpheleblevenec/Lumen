# Design system « Le Studio »

Guide de référence pour toute nouvelle interface Lumen. Tout ce qui est décrit
ici existe déjà dans le code — **réutiliser, ne pas réinventer**. En cas de
doute, ouvrir un écran existant proche et copier ses patterns.

> Source de vérité des tokens : `src/app/globals.css` (`:root` + `@theme inline`).
> Les tokens sont exposés en classes Tailwind (`text-primary`, `bg-card-tint`…).

## 1. Philosophie

- **Indigo + corail sur crème** : le fond est chaud et calme (`--paper`), les
  cartes sont blanches, la couleur est dépensée avec intention — indigo pour
  la structure et les actions « système », corail pour l'énergie (CTA, quiz,
  jour courant, streak validé).
- **Sérif = ce qui compte** : Instrument Serif pour les titres, les grands
  chiffres et les citations. Tout le reste (UI, corps, boutons) en Archivo.
- **Zéro emoji dans l'UI** : icônes lucide uniquement. Les emojis peuvent
  vivre dans le *contenu* généré, jamais dans le chrome de l'app.
- **Boutons « à pousser »** : les actions principales ont une ombre dure
  décalée qui s'écrase au clic. C'est LA signature tactile de l'app.
- **Mobile d'abord** : une colonne ~600px ; le desktop élargit et ajoute un
  rail, il ne réinvente pas.

## 2. Couleurs (tokens)

| Token | Valeur | Classe Tailwind | Usage |
|---|---|---|---|
| `--paper` | `#f6f3ec` | `bg-paper` | Fond de page (crème) |
| `--card` | `#ffffff` | `bg-card` | Cartes |
| `--card-tint` | `#eceafb` | `bg-card-tint` | Bloc domaine, ligne « toi » du classement, carte explication quiz |
| `--ink` | `#22203a` | `text-ink` | Texte principal |
| `--ink-body` | `#2a2740` | `text-ink-body` | Corps de lecture |
| `--ink-soft` | `#6f6b8f` | `text-ink-soft` | Texte secondaire |
| `--ink-faint` | `#a8a394` | `text-ink-faint` | Icônes nav inactives, méta, labels de stat |
| `--ink-warm` | `#8f8b7e` | `text-ink-warm` | Kickers secondaires (bibliothèque) |
| `--line` | `#e3dfd2` | `border-line` | Bordures neutres (choix quiz), pastilles vides |
| `--line-soft` | `#edeae0` | `bg-line-soft` | Jours futurs, fonds désactivés, skeleton |
| `--primary` | `#4338ca` | `bg/text-primary` | Indigo — actions primaires, actif, streak pill |
| `--primary-deep` | `#312a86` | `text-primary-deep` | Titres sérif |
| `--primary-shadow` | `#2d247e` | — (via `push-*`) | Ombre dure des boutons indigo |
| `--primary-soft` | `#e7e4fa` | `bg-primary-soft` | Chips, cercles d'icônes, tab active |
| `--primary-ring` | `#c9c2f2` | — | Ombre dure de la carte « aujourd'hui » (bibliothèque) |
| `--accent` | `#e2543a` | `bg/text-accent` | Corail — CTA quiz, jour courant, badge révisions |
| `--accent-shadow` | `#a83620` | — (via `push-cta`) | Ombre dure des boutons corail |
| `--accent-soft` | `#fbe5df` | `bg-accent-soft` | Fonds soft corail (encadré « pour briller ») |
| `--good` / `--good-soft` | `#2f9e5f` / `#e0f4e7` | `text-good` / `bg-good-soft` | Bonne réponse |
| `--bad` / `--bad-soft` | `#e2543a` / `#fbe5df` | `border-bad` / `bg-bad-soft` | Mauvaise réponse (= accent) |
| `--teal` / `--teal-soft` | `#0f766e` / `#dcf0ed` | `text-teal` / `bg-teal-soft` | Couleur de domaine |
| `--green` / `--green-soft` | `#3f7d33` / `#e3efdd` | `text-green` / `bg-green-soft` | Couleur de domaine |

**Rotation de teintes** (avatars, pastilles de domaine) : indigo → teal →
corail → vert, toujours en paire `couleur` + `fond soft`. Helper prêt :
`DOMAIN_HUES` et `domainStyle(domain)` dans `src/components/domain-icon.tsx`.

**Dégradé « journée validée »** (streak pill uniquement) :
`linear-gradient(135deg,#e2543a,#c73d24)`.

**Dark mode** : la structure `@media (prefers-color-scheme: dark)` existe dans
`globals.css` mais reprend les valeurs claires — le sombre n'est pas couvert
par « Le Studio ». Ne pas écrire de `dark:` en attendant sa refonte.

## 3. Typographie

Fonts chargées dans `src/app/layout.tsx` (`next/font/google`) :

- **Instrument Serif** → `font-display` (variable `--font-instrument`).
  **Toujours weight 400** (la classe `.font-display` le force) — jamais de
  `font-bold` sur du sérif. Italique dispo pour les citations.
- **Archivo** → défaut du `body` (variable `--font-archivo`), 400–700.

Échelle de référence (mobile → desktop quand différent) :

| Rôle | Style |
|---|---|
| Wordmark header | `font-display text-[25px] text-primary-deep` |
| H1 d'écran | `font-display text-[30px] text-primary-deep` |
| H1 état vide / fin | `font-display text-[34px] text-primary-deep` |
| Titre de leçon | `font-display text-[33px] lg:text-[40px] leading-[1.1] text-primary-deep` |
| Question quiz | `font-display text-[26px] lg:text-[30px] leading-[1.25] text-primary-deep` |
| Grand chiffre (stat card) | `font-display text-[38px] tabular-nums text-primary` (ou `text-accent`) |
| H2 de section de leçon | sérif 22px `--primary` + trait corail 34×3px — automatique via `.prose-lesson h2` |
| Citation | `.prose-lesson blockquote` (sérif italique 23px centré indigo) |
| Hook (chapô) | `text-[17px] lg:text-[19px] font-medium text-[#514c6e]` |
| Corps de lecture | `.prose-lesson` (Archivo 15,5px/1.75 → 17px/1.8 en lg) |
| Kicker / label caps | `text-[11px] font-bold uppercase tracking-[0.14em]` (9–11px selon densité, tracking 0.08–0.2em) |
| Label d'encadré | `text-[9.5px] font-bold uppercase tracking-[0.2em] text-primary` (ou `text-accent`) |
| Bouton CTA | `text-sm font-bold uppercase tracking-[0.14em]` |
| Label nav | `text-[10px] font-bold uppercase tracking-[0.08em]` |

## 4. Rayons, ombres, espacements

- **Rayons** : cartes `rounded-[18px]` (ou `rounded-2xl` = 16px pour les choix
  de quiz et encadrés) ; bloc domaine `rounded-[22px]` ; feuille onboarding
  `rounded-t-[26px]` ; tout ce qui est pill/chip/bouton/nav `rounded-full`.
- **Ombres douces** (classes de `globals.css`) : `shadow-card`
  (`0 2px 8px rgba(34,32,58,.06)`) pour les cartes, `shadow-nav`
  (`0 2px 10px rgba(34,32,58,.1)`) pour la nav flottante.
- **Ombres dures « à pousser »** : `push-cta` (corail, 5px), `push-cta-primary`
  (indigo, 5px), `push-pill` (indigo, 3px), `push-pill-accent` (corail, 3px).
  L'effet d'enfoncement au `:active` (translateY + ombre 0, 80ms) est inclus —
  **ne pas ajouter** `active:scale-95` sur ces boutons.
- **Espacements** : padding horizontal de page 16px (`px-4`), contenus 20–26px.
  Listes : `flex`/`grid` + `gap` (10–12px), pas de margins entre siblings.
  Cibles tactiles ≥ 44px (`min-h-11`/`min-h-12`/`min-h-13`).

## 5. Recettes de composants

**CTA principal (corail — quiz, action du jour)**
```tsx
<button className="push-cta min-h-13 w-full rounded-full bg-accent px-6 py-[17px] text-sm font-bold uppercase tracking-[0.14em] text-white">
  Passer au quiz →
</button>
```
Variante indigo (`push-cta-primary bg-primary`) pour les actions « système »
(révisions). `disabled:opacity-60` pendant un submit.

**Bouton secondaire (outline discret)**
```tsx
<button className="min-h-12 rounded-full px-6 py-3 font-medium text-ink-soft transition active:scale-[0.98]" style={{ border: "1.5px solid #ddd6c8" }}>
  Se déconnecter
</button>
```

**Carte standard** : `shadow-card rounded-[18px] bg-card p-4`.
**Carte mise en avant** (aujourd'hui) : `border-2 border-primary` +
`boxShadow: "0 4px 0 var(--primary-ring)"`.
**Ma ligne** (classement) : `border-2 border-primary bg-card-tint`.

**Stat card** (points, streak…)
```tsx
<div className="shadow-card rounded-[18px] bg-card px-6 py-4">
  <p className="font-display text-[38px] tabular-nums text-primary">70</p>
  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Points</p>
</div>
```

**Chip / pill d'info** : `rounded-full bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary` (sur fond teinté) ou `bg-primary-soft` (sur fond blanc).

**Encadrés de leçon** : fond `bg-primary-soft` (anecdote) ou `bg-accent-soft`
(pour briller), `rounded-2xl p-4`, label caps 9,5px + texte
`text-sm leading-[1.65] text-ink-body` (italique pour « pour briller »).

**Choix de quiz** (4 états) : base `border-2 border-line bg-card rounded-2xl` ;
bon → `border-good bg-good-soft` + pastille 22px `bg-good` avec `Check` blanc
+ `animate-pop` ; mauvais choisi → `border-bad bg-bad-soft` + pastille `X` +
`animate-shake` ; autres → `opacity-45`. Voir `lesson-flow.tsx` (le pattern
exact y est, avec `navigator.vibrate`).

**Toggle** : 46×26px, fond `bg-primary` ON / `bg-line` OFF, knob blanc 20px —
composant complet dans `notifications-toggle.tsx`.

**État vide / interstitiel** : cercle 96px `bg-primary-soft` (ou `good-soft`)
avec icône lucide 38–42px, titre sérif 34px, texte `text-ink-soft`, CTA.

**Avatar sans photo** : initiale sur fond de teinte en rotation
(`DOMAIN_HUES`), ou `bg-primary-soft text-primary` en sérif pour le profil.

## 6. Navigation & layout

- **Mobile** : colonne `max-w-[600px]`, header (logo + streak pill), contenu
  `px-4 pb-32`, `BottomNav` = pill flottante fixe (marge 16px, 5 onglets,
  actif = chip `bg-primary-soft` icône + label, badge corail sur Réviser).
- **Desktop (`lg:`)** : `SideNav` (rail sticky 230px : logo, onglets avec
  labels complets, tagline) + colonne `max-w-[680px]`, header réduit à la
  streak pill. Les deux navs vivent dans `src/components/bottom-nav.tsx` et
  se montent/cachent par breakpoint — **toute nouvelle page les hérite via
  `src/app/(app)/layout.tsx`**, rien à faire.
- Nouvel onglet ? Ajouter une entrée au tableau `TABS` de `bottom-nav.tsx`
  (`label` court mobile + `labelLong` desktop + icône lucide), c'est tout.

## 7. Iconographie

- `lucide-react` uniquement. Tailles : 20–21px nav, 17–18px inline, 38–42px
  états vides. `strokeWidth` 1.9 (inactif/neutre) et 2.2 (actif).
- `fill="currentColor"` réservé aux icônes « pleines » qui le supportent bien
  (Flame, Star, Zap) — jamais sur Brain/GraduationCap/Trophy.
- Domaines : mapping officiel dans `domain-icon.tsx` (Histoire `Landmark`,
  Sciences `FlaskConical`, Arts `Palette`, Géopolitique `Globe`, Philosophie
  `Lightbulb`, Économie `Coins`, Carte blanche `Sparkles`).

## 8. Animations

Définies dans `globals.css`, à réutiliser telles quelles :

| Classe | Usage |
|---|---|
| `animate-pop` | Bonne réponse, apparition d'un succès |
| `animate-shake` | Mauvaise réponse |
| `animate-fade-up` | Entrée d'écran / de bloc |
| `animate-slide-in` | Question suivante |
| `animate-flame` | Flamme du streak (en continu) |
| `.skeleton` | Chargement (shimmer sur `line-soft`/`line`) |
| `.hover-lift` | Cartes/lignes cliquables : lift de 2px au survol (souris uniquement) |

Confetti (fin de quiz ≥ 70 pts) : `canvas-confetti` avec les couleurs
`['#4338ca','#e2543a','#e7e4fa','#312a86']`. Vibrations : helper `buzz()`
(18ms succès, [30,40,30] échec). `prefers-reduced-motion` est géré globalement.

## 9. Do / Don't

- ✅ Copier un pattern existant plutôt qu'en créer un proche-mais-différent.
- ✅ `tabular-nums` sur tout chiffre qui change (scores, streaks, compteurs).
- ✅ Textes UI en français, tutoiement, ton chaleureux et direct.
- ✅ Micro-interactions partout où c'est naturel : `hover-lift` sur les listes
  cliquables, `animate-pop`/`animate-shake` sur les feedbacks, vibrations.
- ❌ **Jamais de tiret cadratin « — » ni demi-cadratin « – »** : ni dans l'UI,
  ni dans le contenu généré (règle aussi dans le prompt + validation serveur).
- ❌ Pas d'emoji dans l'UI, pas de `font-bold` sur du sérif, pas de `dark:`.
- ❌ Pas de nouveau hex en dur : si une couleur manque, l'ajouter comme token
  dans `globals.css` + `@theme inline` d'abord.
- ❌ Pas d'`active:scale-95` sur un bouton `push-*` (l'enfoncement est déjà là).

## 10. Marque

« Le Levant » — soleil levant sur l'horizon : demi-cercle corail + horizon et
rayons indigo. Composants `Logo` (header/nav) et `LogoTile` (login, 88px,
tuile indigo) dans `src/components/logo.tsx`. Icônes PWA générées par
`scripts/gen-icons.mjs` (à relancer si la marque évolue). `theme_color` PWA :
`#f6f3ec`.
