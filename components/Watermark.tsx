export default function Watermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-4 right-4 z-40 select-none rounded-full border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[10px] tracking-wide text-slate-500 backdrop-blur-sm"
    >
      wm · <span className="text-ember-soft">Rizky</span>
    </div>
  );
}
