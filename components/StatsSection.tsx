"use client"

import { useEffect, useRef } from 'react'
import { Users, Calendar, Zap, Clock } from 'lucide-react' // Swapped Trophy for Clock for "Duration"
import { motion, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion'

// ==========================================
// ⚡ MANUAL STATS CONTROL
// ==========================================
const DISPLAY_STATS = {
  participants: 200, 
  events: 300,
  teams: 5,
  duration: 3 // Changed key to 'duration' for clarity
};

// ==========================================
// ⚡ ANIMATION VARIANTS
// ==========================================
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { type: "spring", stiffness: 300, damping: 25 } 
  }
};

// ==========================================
// ⚡ HARDWARE-ACCELERATED COUNTER
// ==========================================
function AnimatedCounter({ value, suffix = "" }: { value: number, suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 });
  
  const displayValue = useTransform(springValue, (latest) => 
    Math.round(latest).toLocaleString() + suffix
  );

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, motionValue, value]);

  return <motion.span ref={ref}>{displayValue}</motion.span>;
}

export default function StatsSection({ stats }: { stats?: any }) {
  // ⚡ FIX: We define the FULL class strings here so Tailwind can find them
  const statCards = [
    { 
      label: "Total Participants", 
      value: DISPLAY_STATS.participants, 
      suffix: "+",
      icon: Users, 
      textColor: "text-blue-400", 
      bgClass: "bg-blue-500/10", 
      borderClass: "border-blue-500/20",
      hoverBorder: "group-hover:border-blue-500/40",
      glowClass: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
      gradientFrom: "from-blue-500/5" 
    },
    { 
      label: "Active Events", 
      value: DISPLAY_STATS.events, 
      suffix: "+",
      icon: Calendar, 
      textColor: "text-emerald-400", 
      bgClass: "bg-emerald-500/10", 
      borderClass: "border-emerald-500/20",
      hoverBorder: "group-hover:border-emerald-500/40",
      glowClass: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      gradientFrom: "from-emerald-500/5"
    },
    { 
      label: "Teams", 
      value: DISPLAY_STATS.teams, 
      suffix: "",
      icon: Zap, 
      textColor: "text-indigo-400", 
      bgClass: "bg-indigo-500/10", 
      borderClass: "border-indigo-500/20",
      hoverBorder: "group-hover:border-indigo-500/40",
      glowClass: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]",
      gradientFrom: "from-indigo-500/5"
    },
    { 
      label: "Duration", 
      value: DISPLAY_STATS.duration, 
      suffix: " Days",
      icon: Clock, 
      textColor: "text-amber-400", 
      bgClass: "bg-amber-500/10", 
      borderClass: "border-amber-500/20",
      hoverBorder: "group-hover:border-amber-500/40",
      glowClass: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
      gradientFrom: "from-amber-500/5"
    },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
    >
      {statCards.map((stat, i) => {
        const Icon = stat.icon;
        
        return (
          <motion.div 
            key={i} 
            variants={cardVariants}
            className={`group relative p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-black/40 backdrop-blur-xl border border-white/5 transition-all duration-500 hover:-translate-y-1 overflow-hidden flex items-center sm:block xl:flex xl:items-center gap-5 ${stat.hoverBorder} ${stat.glowClass}`}
          >
            {/* Ambient Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradientFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

            <div className={`shrink-0 p-4 md:p-5 rounded-2xl md:rounded-[1.25rem] border shadow-inner mb-0 sm:mb-5 xl:mb-0 relative z-10 transition-transform duration-500 group-hover:scale-110 ${stat.bgClass} ${stat.borderClass}`}>
              <Icon className={`w-6 h-6 md:w-8 md:h-8 ${stat.textColor}`} />
            </div>
            
            <div className="relative z-10 min-w-0">
              <p className="text-3xl md:text-4xl lg:text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-md truncate">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-1 md:mt-2 truncate group-hover:text-zinc-400 transition-colors">
                {stat.label}
              </p>
            </div>

            {/* Shimmer sweep effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_1.5s_forwards] skew-x-12 pointer-events-none z-20" />
          </motion.div>
        );
      })}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer { 
          0% { transform: translateX(-150%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); } 
        }
      `}} />
    </motion.div>
  )
}