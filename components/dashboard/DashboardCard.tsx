import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
    title: string;
    value: string;
    icon?: string;
    lucide?: LucideIcon;
    color?: string;
    onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, lucide: Icon, icon, color, onClick }) => {
    // Default fallback color
    const iconColor = color || "bg-primary";
    
    return (
        <div 
            className={`card card-glow group relative overflow-hidden p-6 flex flex-col justify-between h-full transition-all duration-300 hover:scale-[1.02] ${onClick ? 'cursor-pointer btn-press' : ''}`} 
            onClick={onClick}
        >
            {/* Soft gradient depth overlay & subtle textured micro-dot pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-indigo-500/5 to-transparent dark:from-white/10 dark:via-indigo-500/10 dark:to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none opacity-25 dark:opacity-15 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="flex items-start justify-between relative z-10">
                <div>
                   <p className="text-xs font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase mb-3">{title}</p>
                   <h2 className="big-stat text-slate-900 dark:text-white drop-shadow-sm font-black transition-all group-hover:text-primary">{value}</h2>
                </div>
                <div className={`flex flex-shrink-0 items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.1)] border border-white/60 dark:border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${iconColor.replace('bg-', 'text-').replace('500', '600')}`}>
                    {Icon ? <Icon className="h-6 w-6" /> : null}
                </div>
            </div>
        </div>
    );
};

export default DashboardCard;