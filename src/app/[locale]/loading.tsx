/**
 * Instant navigation skeleton. Shown in place of the page content while the next
 * storefront route renders on the server, so navigation feels immediate. The
 * shared header/footer stay mounted; only this region swaps in.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="animate-pulse">
        <div className="mb-8 h-8 w-56 rounded-lg bg-black/10" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square w-full rounded-xl bg-black/10" />
              <div className="h-4 w-3/4 rounded bg-black/10" />
              <div className="h-4 w-1/2 rounded bg-black/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
