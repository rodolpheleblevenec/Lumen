export default function BibliothequePage() {
  return (
    <div className="flex flex-col items-center gap-4 pt-20 text-center">
      <span className="text-5xl" aria-hidden>
        📚
      </span>
      <h1 className="text-2xl font-bold">Bibliothèque</h1>
      <p className="max-w-xs text-balance text-stone-500 dark:text-stone-400">
        Toutes les leçons passées seront relisibles ici (V1), avec rattrapage
        de la veille pour sauver ton streak.
      </p>
    </div>
  );
}
