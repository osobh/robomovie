import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-[#1ABC9C] animate-spin" />
        <div className="absolute inset-0 animate-pulse bg-[#1ABC9C]/20 rounded-full" />
      </div>
    </div>
  );
}
