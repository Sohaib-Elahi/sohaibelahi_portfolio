import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Linkedin, Github } from "lucide-react";
import ThreeFlowLoop from "./ThreeFlowLoop";

import brandlinersLogo from "../assets/images/clientlogos/4-Brandliners.png";
import dequanisLogo from "../assets/images/clientlogos/5-DQ.png";
import figoWhiteLogo from "../assets/images/clientlogos/2-FIGO.png";
import jaqLogo from "../assets/images/clientlogos/1-JAQ.png";
import petraLogo from "../assets/images/clientlogos/3-Petrabrands.png";

// High-fidelity vector Github icon matching Lucide style weight and form
// We can use the imported Github from lucide-react directly now

// High-fidelity vector Behance icon matching Lucide style weight and form
const BehanceIcon = ({ size = 20, strokeWidth = 1.5 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
    className="w-[20px] h-[20px]"
  >
    <path d="M9 12a3 3 0 1 0 0-6H5v12h4a3 3 0 1 0 0-6z" />
    <path d="M5 12h4" />
    <path d="M15 15a3 3 0 1 0 6 0v-2h-6v2.5" />
    <path d="M15 12h6" />
    <path d="M16 8h4" />
  </svg>
);

export default function MarketingFeaturesSection() {
  // EDITABLE MARQUEE BRAND LOGOS (Exactly 5 Pills) using local high-fidelity assets
  const brands = [
    { name: "The JAQ Group", logoUrl: jaqLogo, alt: "The JAQ Group" },
    { name: "FIGO Homes", logoUrl: figoWhiteLogo, alt: "FIGO Homes" },
    { name: "Petra Brands", logoUrl: petraLogo, alt: "Petra Brands" },
    { name: "BrandLiners", logoUrl: brandlinersLogo, alt: "BrandLiners" },
    { name: "Dequanis", logoUrl: dequanisLogo, alt: "Dequanis" }
  ];

  return (
    <section className="w-full bg-black text-white py-32 px-6 md:px-12 flex flex-col items-center relative overflow-hidden select-none">

      {/* Three.js full-screen flowing background loop - seamless, no cuts! */}
      <ThreeFlowLoop />

      {/* Background radial soft light to blend beautifully with the header and ambient colors */}
      <div className="absolute inset-x-0 -top-40 h-[600px] bg-[radial-gradient(circle_at_center,_rgba(201,54,46,0.035)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none z-0" />

      {/* Blend mask to the very bottom */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none z-0" />

      <div className="w-full max-w-[850px] mx-auto flex flex-col items-center gap-16 md:gap-22 relative z-10">

        {/* EDITORIAL DESCRIPTION BLOCK (Inspired by Festina Investment Fund style) */}
        <div className="flex flex-col items-center text-center gap-8 max-w-[680px]">

          {/* Core Copy Text: Matches Editorial spacing exactly, using beautifully scaled pure Apple Garamond */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-xl sm:text-[25px] md:text-[29px] text-zinc-100 font-serif font-light leading-relaxed tracking-wide text-center"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
          >
            Hi, I am Sohaib Elahi, a design-centric creative developer trusted by{" "}
            <strong className="font-semibold text-white">international brands</strong> and{" "}
            <strong className="font-semibold text-white">eCommerce stores</strong> worldwide. I design digital tools, high-converting emails, and brand systems with world-class user experience.{" "}
            <span className="inline-block align-middle ml-1">
              <a
                href="mailto:sohaib.e0912003@gmail.com?subject=Project Inquiry"
                className="bg-accent-red hover:bg-accent-red-hover text-white text-[11px] sm:text-xs font-serif font-bold tracking-wider rounded-full py-1.5 px-4 inline-flex items-center gap-2 cursor-none transition-colors duration-200 shadow-lg"
              >
                <span>Work With Me</span>
                <ArrowRight size={12} strokeWidth={2.5} />
              </a>
            </span>
          </motion.p>
        </div>

        {/* LOGO GRID BLOCK: Pure elegant negative space layout with Exactly 5 Custom Logos */}
        <div className="w-full flex flex-col items-center gap-10">

          {/* Static Row of Exactly 5 Brand Logos showing partnerships with absolutely no borders or hover animations */}
          <div className="w-full flex flex-row items-center justify-center gap-x-4 sm:gap-x-8 md:gap-x-10 pt-1 max-w-4xl px-4 select-none">
            {brands.map((brand, i) => (
              <div
                key={i}
                className="flex items-center justify-center select-none pointer-events-none opacity-60 hover:opacity-80 transition-opacity duration-300 shrink-0"
              >
                <img
                  src={brand.logoUrl}
                  alt={brand.alt}
                  referrerPolicy="no-referrer"
                  className="h-8 sm:h-4.5 md:h-7 w-auto object-contain filter brightness-100"
                />
              </div>
            ))}
          </div>

          {/* Social connections row at the very bottom */}
          <div className="flex items-center gap-8 mt-6 text-zinc-400">
            <a
              href="https://www.linkedin.com/in/sohaib-elahi2023/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-200 cursor-none p-2 flex items-center justify-center"
              aria-label="LinkedIn"
            >
              <Linkedin size={20} strokeWidth={1.5} />
            </a>
            <a
              href="https://github.com/Sohaib-Elahi"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-200 cursor-none p-2 flex items-center justify-center"
              aria-label="GitHub"
            >
              <Github size={20} strokeWidth={1.5} />
            </a>
            <a
              href="https://behance.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-200 cursor-none p-2 flex items-center justify-center"
              aria-label="Behance"
            >
              <BehanceIcon size={20} strokeWidth={1.5} />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
