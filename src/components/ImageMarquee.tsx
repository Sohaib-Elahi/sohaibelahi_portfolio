import React from "react";
import { motion } from "motion/react";

import m1 from "../assets/images/marquee1/1.webp";
import m2 from "../assets/images/marquee1/6.webp";
import m3 from "../assets/images/marquee1/10.webp";
import m4 from "../assets/images/marquee1/4.webp";
import m5 from "../assets/images/marquee1/5.webp";
import m6 from "../assets/images/marquee1/2.webp";
import m7 from "../assets/images/marquee1/7.webp";
import m8 from "../assets/images/marquee1/8.webp";
import m9 from "../assets/images/marquee1/9.webp";
import m10 from "../assets/images/marquee1/3.webp";
import m11 from "../assets/images/marquee1/11.webp";
import m12 from "../assets/images/marquee1/16.webp";
import m13 from "../assets/images/marquee1/13.webp";
import m14 from "../assets/images/marquee1/14.webp";
import m15 from "../assets/images/marquee1/15.webp";
import m16 from "../assets/images/marquee1/12.webp";

const IMAGES = [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, m16];

export default function ImageMarquee() {
  // Use exactly 2 copies (double) to align the infinite translate precisely at half (50%)
  const doubledImages = [...IMAGES, ...IMAGES];

  return (
    <div className="w-full bg-black py-10 sm:py-14 md:py-18 overflow-hidden relative select-none z-20">
      <div className="flex w-full overflow-hidden">
        <motion.div
          className="flex shrink-0"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            ease: "linear",
            duration: 30, // Extremely smooth luxury velocity
            repeat: Infinity,
          }}
        >
          {doubledImages.map((src, index) => (
            <div
              key={index}
              className="px-2 sm:px-3 shrink-0 pointer-events-none"
            >
              <div
                className="aspect-[4/5] w-[180px] sm:w-[240px] md:w-[280px] lg:w-[320px] rounded-2xl overflow-hidden shadow-2xl border border-white/[0.04] relative"
                style={{
                  transform: "translateZ(0)",
                  WebkitTransform: "translateZ(0)",
                  isolation: "isolate"
                }}
              >
                <img
                  src={src}
                  alt={`Inspirational design ${index % IMAGES.length}`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-cover rounded-2xl select-none pointer-events-none"
                />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

