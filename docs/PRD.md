# PRD — Lumen

> Webapp mobile-first de culture générale pour un cercle privé de proches.
> Version 1.0 — 03/07/2026. Voir [benchmark.md](benchmark.md) pour l'analyse marché.

---

## 1. Vision

**Lumen** transforme 5 minutes par jour en culture générale durable. Chaque matin, une leçon vivante attend tout le groupe ; un quiz la valide, la répétition espacée l'ancre pour de bon, et les streaks + le classement entretiennent une émulation bienveillante entre proches.

Ce que Lumen fait mieux que les apps du marché (Sophia, Sapio) :
- **Le web** : zéro installation obligatoire, un lien suffit, desktop et mobile.
- **La rétention réelle** : répétition espacée (SRS) au cœur du produit — les notions reviennent à J+2, J+7, J+30 au lieu d'être oubliées.
- **Le social entre proches** : la même leçon pour tous crée la conversation ; le classement hebdo crée le jeu.
- **La gratuité** : pas de premium, pas de pub. Seul coût de fonctionnement : ~3 €/mois de tokens API.

### Non-objectifs
- Pas de mise sur le marché, pas de monétisation, pas de croissance utilisateurs.
- Pas de duels/multijoueur temps réel (peut-être plus tard).
- Pas d'app native iOS/Android — la PWA couvre le besoin.

## 2. Utilisateurs

- **Cercle privé** : Rodolphe + proches (~5-15 personnes), francophones, sur mobile principalement.
- Accès sur invitation implicite : l'app n'est pas référencée ; **connexion Google OAuth** (un clic, zéro mot de passe). Une allowlist d'emails contrôle qui peut entrer.

## 3. Décisions produit (arbitrées)

| Sujet | Décision |
|---|---|
| Contenu | **Leçon du jour partagée**, identique pour tous, pré-générée chaque nuit par l'API OpenAI |
| Choix du thème | **Calendrier thématique** : chaque jour de la semaine a son domaine fixe |
| Format leçon | ~800 mots (5-7 min), sérieuse sur le fond, **ton vivant** avec anecdotes et accroches |
| Quiz | **Adaptatif** : 3 questions de base + 2 difficiles débloquées si sans-faute |
| Rétention | **SRS central** — chaque notion revient à J+2 / J+7 / J+30 (SM-2 simplifié) |
| Social | **Streaks + classement hebdo** (pas de duels) |
| Récompenses | **Badges + jalons** (streak 7/30/100, domaines maîtrisés…) |
| Leçons passées | **Bibliothèque complète + rattrapage** : la leçon de la veille rattrapée sous 24h sauve le streak (1 joker/semaine) |
| Mobile | **PWA installable + notification push** quotidienne « Ta leçon est prête » |
| Auth | **Google OAuth** (Supabase) |
| Nom | **Lumen** |

### Calendrier thématique (proposition initiale, configurable)

| Jour | Domaine |
|---|---|
| Lundi | Histoire |
| Mardi | Sciences & nature |
| Mercredi | Arts & littérature |
| Jeudi | Géopolitique & monde contemporain |
| Vendredi | Philosophie & idées |
| Samedi | Économie & société |
| Dimanche | Carte blanche (mythologie, insolite, sport, gastronomie…) |

## 4. Fonctionnalités

### 4.1 Leçon du jour
- Publiée chaque nuit (~5h, heure de Paris) pour être prête au réveil.
- Structure générée : **titre accrocheur → chapeau (l'essentiel en 3 phrases) → corps en 3-4 sections courtes → anecdote mémorable → « pour briller » (la phrase à ressortir en société)**.
- ~800 mots, français, ton vivant mais rigoureux. Markdown rendu proprement sur mobile.
- Anti-redite : le générateur reçoit la liste des sujets déjà traités dans le domaine.

### 4.2 Quiz adaptatif
- **Phase 1** : 3 QCM (4 choix) sur les notions clés de la leçon — 10 pts/bonne réponse.
- **Phase 2** : si 3/3, déblocage de 2 questions difficiles (nuances, pièges) — 20 pts chacune. Score parfait : 70 pts.
- Chaque réponse affiche immédiatement la correction + une explication d'une phrase (pré-générée, pas d'appel API).
- Le quiz complété **valide le jour** (streak) et **crée les cartes SRS** des 5 notions.

### 4.3 Répétition espacée (SRS)
- Chaque notion quizzée devient une **carte** personnelle avec un niveau : `0 → J+2 → J+7 → J+30 → J+90 → acquise`.
- Réussite = niveau supérieur ; échec = retour à J+2. Pas de paramètre d'ease pour rester simple (SM-2 allégé).
- **Session de révision quotidienne** : les cartes dues du jour, plafonnées à 10 pour rester légère (les plus anciennes d'abord). 5 pts/carte réussie.
- Les questions de révision réutilisent les QCM d'origine (variante : ordre des choix mélangé).
- Une notion « acquise » compte pour le badge de maîtrise du domaine.

### 4.4 Streaks, classement, badges
- **Streak** : un jour est validé par le quiz du jour terminé. Rattrapage possible sous 24h (1 joker/semaine, non cumulable).
- **Classement hebdomadaire** : somme des points (quiz + révisions + rattrapages), remis à zéro le lundi 00h. Podium de la semaine passée conservé.
- **Badges** : streak 7/30/100/365, première semaine parfaite, 50 notions acquises, domaine maîtrisé (30 notions acquises dans un domaine), n°1 hebdo…
- Les streaks et badges des autres membres sont visibles (émulation).

### 4.5 Bibliothèque
- Toutes les leçons passées, filtrables par domaine, avec statut personnel (lue / quiz fait / score).
- Une leçon ancienne reste lisible et quizzable (points réduits : 5 pts/question, pas de streak) — utile pour les nouveaux arrivants du groupe.

### 4.6 PWA & notifications
- **Installable** (manifest + service worker) : icône, plein écran, splash.
- **Offline léger** : la leçon du jour et les cartes dues sont mises en cache à l'ouverture.
- **Push quotidien** (Web Push/VAPID, opt-in par utilisateur, heure choisie — défaut 8h) : « ☀️ Ta leçon du jour t'attend : *{titre}* ». Second rappel optionnel le soir si le jour n'est pas validé (« Ton streak de {n} jours est en jeu ! »).
- iOS : notifications supportées pour les PWA ajoutées à l'écran d'accueil (iOS 16.4+).

### 4.7 Comptes & groupe
- Google OAuth via Supabase. Allowlist d'emails gérée en base (table `lumen_allowed_emails`).
- Le projet Supabase est **partagé avec d'autres apps** : l'allowlist ne bloque pas la création du compte auth (pool commun) — un connecté non invité voit un écran « non invité » car il n'a pas de profil Lumen.
- Profil minimal : prénom affiché, avatar Google, préférences de notification.

## 5. Parcours utilisateur type (mobile)

```
Notification 8h ──▶ Leçon (5-7 min) ──▶ Quiz (1-2 min) ──▶ Écran de score
                                                        │  + streak +1, points,
                                                        ▼  cartes SRS créées
                                            Révisions dues ? (≤10 cartes, 2 min)
                                                        │
                                                        ▼
                                            Classement / retour à la vie réelle
```

Temps quotidien total visé : **≤ 10 minutes**.

## 6. Design mobile-first

- **Navigation par barre inférieure** (pouce) : Aujourd'hui · Révisions (avec pastille du nombre de cartes dues) · Classement · Bibliothèque · Profil.
- Une seule colonne, typographie généreuse (leçon lisible sans zoom), cibles tactiles ≥ 44px.
- Quiz plein écran, une question à la fois, feedback immédiat animé.
- Dark mode automatique (prefers-color-scheme).
- Desktop = même layout centré (max-width ~600px) : aucun développement spécifique.
- Identité « Lumen » : lumière/clarté — à définir (palette chaude, éviter l'esthétique IA générique).

## 7. Génération de contenu (pipeline IA)

### Pipeline nocturne
1. **Cloud Scheduler (GCP)** déclenche chaque nuit vers 4h30 Europe/Paris une route API Next.js protégée (header secret / OIDC).
2. La route lit le domaine du jour (calendrier) + la liste des titres déjà traités dans ce domaine.
3. **Un appel API OpenAI** (`gpt-5.5`, Structured Outputs / json_schema) génère : leçon complète + 3 questions de base + 2 questions bonus + 5 notions SRS (label + rattachement aux questions) + explications par réponse.
4. Validation du JSON (schéma strict), insertion en base, statut `published`.
5. Envoi des notifications push aux abonnés à leur heure choisie (second job Cloud Scheduler).
6. **Garde-fou** : si la génération échoue (2 retries), alerte (email) et republication de la leçon en brouillon de secours.

### Modèle & coûts
- **Modèle : GPT-5.5** (flagship OpenAI — 5 $/M entrée, 30 $/M sortie). Entrée ~1 200 tokens (prompt + anti-redites), sortie ~3 000 tokens (leçon + quiz + notions structurés).
- Coût : ~0,10 $/leçon → **~3 $/mois**. Latence indifférente la nuit.
- Repli économique si besoin : `gpt-5.4` (2,50 $/15 $ par M) divise le coût par deux, `gpt-5.4-mini` le rend négligeable — à comparer sur la qualité de rédaction.
- Les révisions SRS et relectures ne coûtent **rien** (contenu stocké).
- V2 optionnelle : bouton « creuser cette notion » (appel à la demande, ~0,03 $/usage).

### Qualité du contenu
- Prompt système versionné dans le repo (`src/server/generation/prompt.md`).
- Exigences : exactitude factuelle, datation prudente, pas d'actualité brûlante (le modèle n'a pas les news du jour), niveau « honnête homme » accessible sans prérequis.
- Boucle d'amélioration : un bouton « signaler une erreur » sur chaque leçon, visible par l'admin.

## 8. Architecture technique

| Couche | Choix |
|---|---|
| Framework | **Next.js (App Router) + TypeScript**, Tailwind CSS, PWA (Serwist / next-pwa) |
| Backend | **Routes API / Server Actions Next.js** (génération, push, logique serveur) — **clé OpenAI uniquement côté serveur** |
| Données & auth | **Supabase** : Auth (Google OAuth), Postgres + RLS — free tier (l'équivalent GCP, Cloud SQL, coûterait ~10 $/mois) |
| IA | **API OpenAI** — `gpt-5.5`, Structured Outputs (json_schema) |
| Cron | **GCP Cloud Scheduler** (génération nocturne + envoi des push) |
| Push | Web Push (VAPID) via le package `web-push` dans une route API |
| Hébergement | **GCP Cloud Run** (conteneur Next.js, scale-to-zero) + Supabase free tier |
| Coût total | ~3 $/mois de tokens + Cloud Run/Scheduler quasi nuls à ce trafic |

### Modèle de données (esquisse)

Projet Supabase **partagé entre plusieurs apps** → toutes les tables (et futures edge functions) sont préfixées `lumen_` :

```
lumen_profiles           (id → auth.users, display_name, avatar_url, notif_time, timezone)
lumen_allowed_emails     (email)
lumen_lessons            (id, date UNIQUE, domain, title, hook, body_md, anecdote, flex_phrase, status)
lumen_questions          (id, lesson_id, tier: base|bonus, prompt, choices jsonb, answer_idx, explanation)
lumen_notions            (id, lesson_id, question_id, label)
lumen_lesson_progress    (user_id, lesson_id, read_at, quiz_completed_at, score, is_catchup)
lumen_srs_cards          (user_id, notion_id, level 0-5, due_date, last_reviewed_at)
lumen_points_ledger      (user_id, occurred_at, source: quiz|bonus|review|catchup, points)
lumen_streaks            (user_id, current, best, last_validated_date, joker_used_week_of)
lumen_badges             (user_id, badge_key, earned_at)
lumen_push_subscriptions (user_id, endpoint, p256dh, auth)
lumen_error_reports      (user_id, lesson_id, message, created_at)
lumen_domain_calendar    (weekday, domain)
```

RLS : chaque utilisateur ne lit/écrit que ses données ; le contenu (`lumen_lessons`, `lumen_questions`, `lumen_notions`) et le classement sont lisibles par les **membres du cercle uniquement** (fonction `lumen_is_member()` — être authentifié ne suffit pas, le pool auth est partagé avec les autres apps) ; écriture réservée au service role (routes serveur Next.js).

## 9. Écrans (MVP)

1. **Connexion** — logo + bouton Google (écran « non invité » si l'email est hors allowlist).
2. **Aujourd'hui** — leçon du jour (ou état « déjà validé ✅ » avec score et lien révisions).
3. **Quiz** — plein écran, question par question, écran de score final (points, streak, cartes créées).
4. **Révisions** — session de cartes dues, même UX que le quiz.
5. **Classement** — semaine en cours + streaks de chacun + podium semaine passée.
6. **Bibliothèque** — liste des leçons par date/domaine avec statut personnel.
7. **Profil** — badges, stats perso (notions acquises par domaine), réglages notifications, déconnexion.

## 10. Roadmap

### V0 — Squelette fonctionnel
Auth Google + allowlist · pipeline de génération nocturne · écran leçon · quiz adaptatif · streak de base · déploiement.

### V1 — Le cœur complet
SRS + écran révisions · points & classement hebdo · badges · bibliothèque + rattrapage/joker · PWA installable + push.

### V2 — Confort & extras
« Creuser cette notion » (IA à la demande) · stats détaillées par domaine · vote occasionnel du thème du dimanche · cartes à collectionner illustrées · signalement d'erreurs → régénération.

## 11. Métriques de succès (à l'échelle du groupe)

- **Rétention** : ≥ 70 % des membres actifs valident ≥ 5 jours/semaine après 1 mois.
- **Rétention mémorielle** : taux de réussite des révisions J+30 ≥ 60 %.
- **Le vrai KPI** : le groupe en parle encore (et s'en ressert en soirée) après 3 mois.

## 12. Risques & points ouverts

| Risque / question | Mitigation / à trancher |
|---|---|
| Erreur factuelle dans une leçon | Prompt prudent + bouton signalement + correction manuelle |
| Push iOS capricieux (PWA) | Second canal : rappel par email (Supabase) en option |
| Génération nocturne en échec | Retries + leçon de secours + alerte admin |
| Sujets qui s'épuisent dans un domaine | L'anti-redite reçoit l'historique ; élargir les domaines au besoin |
| Calendrier thématique exact | Proposition §3 à valider/ajuster en configuration |
| Identité visuelle (palette, logo) | À définir avant V0 (piste : lumière chaude, sobre) |
