import React, { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
          scrub: true,
        },
      });

      gsap.to(".ribbon-fg", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".headline-center", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full flex items-center justify-center overflow-hidden bg-black border-t border-zinc-900/50"
      style={{ minHeight: "clamp(500px, 80vh, 800px)" }}
    >
      {/* Pure CSS atmospheric background — replaces heavy Three.js WebGL context */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Deep radial glow centre */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,rgba(153,27,27,0.18)_0%,rgba(0,0,0,0)_70%)]" />
        {/* Subtle top flare */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(239,68,68,0.07)_0%,transparent_70%)]" />
        {/* Noise grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
      </div>

      {/* Top Background Ribbon */}
      <div className="absolute top-[18%] md:top-[22%] left-[-10%] w-[120%] ribbon-bg -rotate-[5deg] md:-rotate-6 z-0 shadow-[0_0_50px_rgba(153,27,27,0.4)]">
        <div className="bg-gradient-to-r from-black via-[#3f0f0f] to-black py-4 md:py-5 border-y border-[#7f1d1d]/80">
          <MarqueeRow text="let's work together" />
        </div>
      </div>

      {/* Giant Glowing Headline — Particle Text */}
      <div className="headline-center text-center z-30 flex flex-col items-center justify-center select-none relative px-4 sm:px-6 w-full max-w-5xl">
        {/* Subtle text-backing glow for extra readability */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.55)_0%,_rgba(0,0,0,0)_65%)] -z-10 pointer-events-none" />
        <InteractiveTextCanvas />
      </div>

      {/* Bottom Foreground Ribbon */}
      <div className="absolute bottom-[18%] md:bottom-[22%] left-[-10%] w-[120%] ribbon-fg rotate-[4deg] md:rotate-[5deg] z-20 shadow-[0_0_50px_rgba(153,27,27,0.4)]">
        <div className="bg-gradient-to-r from-black via-[#3f0f0f] to-black py-4 md:py-5 border-y border-[#7f1d1d]/80">
          <MarqueeRow text="open for projects" reverse />
        </div>
      </div>

      {/* Edge fades so ribbons don't abruptly cut off */}
      <div className="absolute inset-y-0 left-0 w-16 md:w-40 bg-gradient-to-r from-black via-black/80 to-transparent z-30 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 md:w-40 bg-gradient-to-l from-black via-black/80 to-transparent z-30 pointer-events-none" />

      {/* Base fade top and bottom */}
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black via-black/70 to-transparent z-30 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black via-black/70 to-transparent z-30 pointer-events-none" />
    </section>
  );
}
