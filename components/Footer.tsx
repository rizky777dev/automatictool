import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 flex flex-col items-center gap-2 border-t border-white/5 py-8 text-center">
      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-ember-soft" />
        <span>Token diproses hanya di memori — tidak pernah disimpan</span>
      </div>
      <p className="text-sm text-slate-400">
        Developed by <span className="bg-gradient-ember bg-clip-text font-semibold text-transparent">Rizky</span>
      </p>
    </footer>
  );
}
