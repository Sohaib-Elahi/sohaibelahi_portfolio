import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    // Use GSAP context for safe React cleanup
    const ctx = gsap.context(() => {
      // Set anchor point to left
      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });

      gsap.to(bar, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.25, // Adds an elegant smooth lag to the scrubbing
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Keep the glow pulse matching the right edge position of the progress meter
            if (glowRef.current) {
              gsap.set(glowRef.current, {
                x: `${self.progress * 100}%`,
                opacity: self.progress > 0.01 ? 1 : 0,
              });
            }
          },
        },
      });
    });

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div id="scroll-progress-portal" className="fixed top-0 left-0 right-0 h-[3px] bg-white/[0.02] z-[9999] pointer-events-none select-none">
      {/* Dynamic Progress Metric */}
      <div
        ref={barRef}
        className="h-full w-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 shadow-[0_1px_8px_rgba(239,68,68,0.5)]"
      />

      {/* Floating Glow Tip Particle */}
      <div
        ref={glowRef}
        className="absolute top-0 left-0 -ml-1.5 w-3 h-3 bg-amber-400 rounded-full blur-[3px] opacity-0 transition-opacity duration-300 pointer-events-none shadow-[0_0_10px_#f59e0b,0_0_20px_#ef4444]"
        style={{ transform: "translateY(-30%)" }}
      />
    </div>
  );
}
