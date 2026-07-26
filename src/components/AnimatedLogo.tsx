import { Wallet } from 'lucide-react';

export default function AnimatedLogo() {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="absolute w-16 h-16 rounded-2xl bg-[#1B3022]/10 animate-pulse" />
      <div className="absolute w-12 h-12 rounded-xl bg-[#1B3022]/15 rotate-12 animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="relative w-14 h-14 rounded-xl bg-[#1B3022] text-white flex items-center justify-center shadow-lg shadow-[#1B3022]/30 animate-pulse" style={{ animationDuration: '2s' }}>
        <Wallet className="w-7 h-7" />
      </div>
    </div>
  );
}
