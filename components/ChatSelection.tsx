'use client';

import { Users, ShieldCheck, ArrowRight } from 'lucide-react';

interface ChatSelectionProps {
  onSelect: (type: 'user' | 'management') => void;
}

export default function ChatSelection({ onSelect }: ChatSelectionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center mb-10 space-y-2">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Communication Hub</h2>
        <p className="text-gray-500 max-w-md mx-auto">Select the appropriate channel to continue your conversation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* User Chat Card */}
        <button
          onClick={() => onSelect('user')}
          className="group relative bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#D4A843]/20 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={120} />
          </div>
          
          <div className="h-14 w-14 rounded-2xl bg-[#D4A843]/10 text-[#D4A843] flex items-center justify-center mb-6 group-hover:bg-[#D4A843] group-hover:text-white transition-colors duration-300">
            <Users size={28} />
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-2">Team Chat</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Public room for all portal users. Real-time team collaboration and general announcements.
          </p>
          
          <div className="flex items-center gap-2 text-[#D4A843] font-semibold text-sm">
            Enter Chat <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Management Chat Card */}
        <button
          onClick={() => onSelect('management')}
          className="group relative bg-[#101013] rounded-3xl p-8 shadow-xl shadow-black/20 border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#D4A843]/10 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck size={120} className="text-white" />
          </div>
          
          <div className="h-14 w-14 rounded-2xl bg-white/5 text-[#D4A843] flex items-center justify-center mb-6 group-hover:bg-[#D4A843] group-hover:text-white transition-colors duration-300">
            <ShieldCheck size={28} />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Management Hub</h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Restricted area for internal staff. Private communication and user oversight panel.
          </p>
          
          <div className="flex items-center gap-2 text-[#D4A843] font-semibold text-sm">
            Access Management <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
}
