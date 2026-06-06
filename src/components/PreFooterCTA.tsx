import React, { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PreFooterCanvas from "./PreFooterCanvas";
import InteractiveTextCanvas from "./InteractiveTextCanvas";

gsap.registerPlugin(ScrollTrigger);

const MarqueeRow = ({ text, reverse = false, className = "" }: { text: string; reverse?: boolean; className?: string }) => {
  const content = (
    <div className="flex gap-12 px-6 items-center shrink-0">
      {[...Array(6)].map((_, i) => (
        <React.Fragment key={i}>
          <span className="text-xl md:text-3xl font-sans font-black uppercase tracking-widest text-[#ef4444] drop-shadow-[0_0_12px_rgba(239,68,68,0.3)]">{text}</span>
          <span className="text-xl md:text-3xl text-[#ef4444]/40">✦</span>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className={`flex whitespace-nowrap overflow-hidden select-none ${className}`}>
      <motion.div
        initial={{ x: reverse ? "-50%" : "0%" }}
        animate={{ x: reverse ? "0%" : "-50%" }}
        transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
        className="flex shrink-0 min-w-[200%]"
      >
        {content}
        {content}
        {content}
        {content}
      </motion.div>
    </div>
  );
};

export default function PreFooterCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".ribbon-bg", {
        yPercent: -30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
      
      gsap.to(".ribbon-fg", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });

      gsap.to(".headline-center", {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-black border-t border-zinc-900/50">
      
      {/* 3D GLSL Canvas Background */}
      <PreFooterCanvas />

      {/* Top Background Ribbon */}
      <div className="absolute top-[18%] md:top-[22%] left-[-10%] w-[120%] ribbon-bg -rotate-[5deg] md:-rotate-6 z-0 shadow-[0_0_50px_rgba(153,27,27,0.4)]">
        <div className="bg-gradient-to-r from-black via-[#3f0f0f] to-black py-4 md:py-5 border-y border-[#7f1d1d]/80">
          <MarqueeRow text="let's work together" />
        </div>
      </div>

      {/* Giant Glowing Headline with Particles */}
      <div className="headline-center text-center z-30 flex flex-col items-center justify-center gap-1 md:gap-2 select-none relative px-6 w-full max-w-5xl overflow-hidden">
        
        {/* Subtle glow behind the text to enhance readability */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.6)_0%,_rgba(0,0,0,0)_60%)] -z-10 pointer-events-none" />
        
        <InteractiveTextCanvas />
      </div>

      {/* Bottom Foreground Ribbon */}
      <div className="absolute bottom-[18%] md:bottom-[22%] left-[-10%] w-[120%] ribbon-fg rotate-[4deg] md:rotate-[5deg] z-20 shadow-[0_0_50px_rgba(153,27,27,0.4)]">
        <div className="bg-gradient-to-r from-black via-[#3f0f0f] to-black py-4 md:py-5 border-y border-[#7f1d1d]/80">
          <MarqueeRow text="open for projects" reverse />
        </div>
      </div>
      
      {/* Dark fade on the edges so ribbons don't feel abruptly cut off horizontally */}
      <div className="absolute inset-y-0 left-0 w-16 md:w-40 bg-gradient-to-r from-black via-black/80 to-transparent z-30 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 md:w-40 bg-gradient-to-l from-black via-black/80 to-transparent z-30 pointer-events-none" />
      
      {/* Base Fade at top and bottom */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black via-black/80 to-transparent z-30 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-30 pointer-events-none" />
      
    </section>
  );
}
