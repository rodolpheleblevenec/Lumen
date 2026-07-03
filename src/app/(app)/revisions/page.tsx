export default function RevisionsPage() {
  return (
    <div className="flex flex-col items-center gap-4 pt-20 text-center">
      <span className="text-5xl" aria-hidden>
        🔁
      </span>
      <h1 className="text-2xl font-bold">Révisions</h1>
      <p className="max-w-xs text-balance text-stone-500 dark:text-stone-400">
        La répétition espacée arrive en V1 : tes notions reviendront ici à
        J+2, J+7 et J+30.
      </p>
    </div>
  );
}
