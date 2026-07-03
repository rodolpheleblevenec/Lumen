export default function Loading() {
  return (
    <div className="space-y-5 pt-2" aria-busy="true" aria-label="Chargement">
      <div className="skeleton h-14 rounded-2xl" />
      <div className="space-y-3">
        <div className="skeleton h-4 w-32 rounded-full" />
        <div className="skeleton h-8 w-4/5 rounded-lg" />
        <div className="skeleton h-8 w-3/5 rounded-lg" />
      </div>
      <div className="space-y-2.5 pt-2">
        <div className="skeleton h-4 rounded-full" />
        <div className="skeleton h-4 rounded-full" />
        <div className="skeleton h-4 w-11/12 rounded-full" />
        <div className="skeleton h-4 w-4/5 rounded-full" />
      </div>
      <div className="skeleton h-28 rounded-2xl" />
    </div>
  );
}
