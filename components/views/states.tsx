import { Music2, RotateCw } from "lucide-react";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid place-items-center py-24 text-center">
      <Music2 className="mb-4 h-10 w-10 text-fuchsia-300/60" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-white/50">{body}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto my-16 max-w-md rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-center">
      <h2 className="mb-1 font-semibold">We hit a snag</h2>
      <p className="text-sm text-rose-100/80">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-4 !py-2">
          <RotateCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div aria-busy className="animate-pulse">
      <div className="mb-10 h-64 rounded-[2rem] bg-white/5" />
      <div className="mb-4 h-7 w-56 rounded-lg bg-white/5" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div aria-busy className="grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5" />
      ))}
    </div>
  );
}
