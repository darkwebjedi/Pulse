/** Artwork thumbnail with a gradient fallback while loading / when there is no image. */
export default function Cover({ src, className = "" }: { src: string | null; className?: string }) {
  return (
    <span className={`block shrink-0 overflow-hidden bg-gradient-to-br from-violet-700/60 to-fuchsia-600/60 ${className}`}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      )}
    </span>
  );
}
