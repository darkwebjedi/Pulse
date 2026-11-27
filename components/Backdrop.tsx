import ParticleBackground from "./ParticleBackground";

/** Fixed full-screen purple gradient with slowly drifting glows and falling particles. */
export default function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0b0316]">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#14052a_0%,#2d0b52_42%,#4a0e62_72%,#160520_100%)]" />
      <div className="blob animate-drift-a -left-[10%] -top-[15%] h-[60vmax] w-[60vmax] bg-[radial-gradient(closest-side,rgba(124,58,237,0.5),transparent)]" />
      <div className="blob animate-drift-b -right-[15%] top-[10%] h-[55vmax] w-[55vmax] bg-[radial-gradient(closest-side,rgba(192,38,211,0.45),transparent)]" />
      <div className="blob animate-drift-c -bottom-[25%] left-[20%] h-[50vmax] w-[50vmax] bg-[radial-gradient(closest-side,rgba(236,72,153,0.3),transparent)]" />
      <ParticleBackground />
      {/* Vignette keeps text contrast at the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(6,2,12,0.55)_100%)]" />
    </div>
  );
}
