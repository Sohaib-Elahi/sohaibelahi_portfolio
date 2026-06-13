import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import m1 from "../assets/images/Marquee2/1.webp";
import m2 from "../assets/images/Marquee2/2.webp";
import m3 from "../assets/images/Marquee2/3.webp";
import m4 from "../assets/images/Marquee2/8.webp";
import m5 from "../assets/images/Marquee2/5.webp";
import m6 from "../assets/images/Marquee2/6.webp";
import m11 from "../assets/images/Marquee2/5.webp";
import m12 from "../assets/images/Marquee2/4.webp";
import m13 from "../assets/images/Marquee2/6.webp";
import m14 from "../assets/images/Marquee2/7.webp";
import m15 from "../assets/images/Marquee2/8.webp";
import m16 from "../assets/images/Marquee2/5.webp";

const ROW_1_IMAGES = [m11, m12, m13, m14, m15, m16];
const ROW_2_IMAGES = [m1, m2, m3, m4, m5, m6];

export default function PortfolioScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const row1 = row1Ref.current;
    const row2 = row2Ref.current;

    if (!container || !row1 || !row2) return;

    const ctx = gsap.context(() => {
      // Smooth parallax on ScrollTrigger: Row 1 moves left, Row 2 moves right
      gsap.fromTo(
        row1,
        { x: "5%" },
        {
          x: "-25%",
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        }
      );

      gsap.fromTo(
        row2,
        { x: "-25%" },
        {
          x: "5%",
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="w-full bg-black py-20 pb-32 sm:py-28 overflow-hidden relative select-none z-10 flex flex-col gap-8 md:gap-12"
    >
      {/* Visual background atmospheric lights for premium contrast */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-red-950/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-zinc-900/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Row 1: Sliding Left */}
      <div className="w-full overflow-hidden flex">
        <div
          ref={row1Ref}
          className="flex gap-6 sm:gap-10 px-8 whitespace-nowrap will-change-transform shrink-0"
        >
          {ROW_1_IMAGES.map((src, index) => (
            <div
              key={`row1-${index}`}
              className="aspect-[4/3] w-[200px] sm:w-[280px] md:w-[360px] lg:w-[420px] rounded-2xl overflow-hidden shrink-0 pointer-events-none shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              <img
                src={src}
                alt={`Portfolio mock 1-${index}`}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover pointer-events-none select-none grayscale-[15%] hover:grayscale-0 transition-all duration-700"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Sliding Right */}
      <div className="w-full overflow-hidden flex">
        <div
          ref={row2Ref}
          className="flex gap-6 sm:gap-10 px-8 whitespace-nowrap will-change-transform shrink-0"
        >
          {ROW_2_IMAGES.map((src, index) => (
            <div
              key={`row2-${index}`}
              className="aspect-[4/3] w-[200px] sm:w-[280px] md:w-[360px] lg:w-[420px] rounded-2xl overflow-hidden shrink-0 pointer-events-none shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              <img
                src={src}
                alt={`Portfolio mock 2-${index}`}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover pointer-events-none select-none grayscale-[15%] hover:grayscale-0 transition-all duration-700"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
