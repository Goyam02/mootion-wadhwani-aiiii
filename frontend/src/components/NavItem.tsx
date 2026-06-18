import React from 'react';
import { ChevronRight } from 'lucide-react';

export function NavItem({ icon, label, active = false, onClick, isMobile = false }: { icon: React.ReactNode, label?: string, active?: boolean, onClick?: () => void, isMobile?: boolean }) {
  if (isMobile) {
    return (
      <div 
        onClick={onClick}
        className={`flex items-center gap-4 px-5 py-3.5 rounded-full cursor-pointer transition-all duration-300 font-bold ${active ? 'bg-[#1800ad] text-[#f6f4ee] shadow-md' : 'text-[#1800ad] hover:bg-[#1800ad]/10 border-2 border-transparent hover:border-[#1800ad]/20'}`}
      >
        {icon}
        {label && <span>{label}</span>}
        {active && <ChevronRight size={16} className="ml-auto opacity-70" />}
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-all duration-300 ${active ? 'bg-[#f6f4ee] text-[#1800ad] shadow-md' : 'text-[#f6f4ee] hover:bg-[#f6f4ee]/20'}`}
      title={label}
    >
      {icon}
    </div>
  );
}
