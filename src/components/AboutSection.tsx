import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import AboutBackgroundCanvas from "./AboutBackgroundCanvas";

gsap.registerPlugin(ScrollTrigger);

interface StoryItem {
  title: string;
  subtitle: string;
  time: string;
}

const experienceList: StoryItem[] = [
  {
    title: "Brand Email Designer",
    subtitle: "The JAQ Group (UK Remote)",
    time: "2025 — Present",
  },
  {
    title: "Amazon Brand Designer",
    subtitle: "Petra Brands / SwiftStart",
    time: "2024 — 2025",
  },
  {
    title: "Senior Brand Designer",
    subtitle: "FIGO Homes (US Startup)",
    time: "2022 — 2025",
  },
  {
    title: "Senior Graphic & Web Designer",
    subtitle: "BrandLiners",
    time: "2021 — 2024",
  },
  {
    title: "Senior Graphic Designer",
    subtitle: "Dequanis",
    time: "2020 — 2021",
  },
];

const skillsList = [
  "Brand Design",
  "Email Design (Klaviyo)",
  "Amazon A+ Listing Design",
  "UI/UX Design",
  "Web Development",
  "React.js & Next.js",
  "Three.js & Creative Coding",
  "Generative AI & LLMs",
  "AI Content Automation",
  "Shopify & WordPress",
];

export default function AboutSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const triggerEl = containerRef.current;
    if (!triggerEl) return;

    const ctx = gsap.context(() => {
      // Elegant scroll trigger reveal for all columns
      gsap.fromTo(
        ".reveal-section-col",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: triggerEl,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="about-section"
      className="w-full bg-black text-white py-28 px-6 md:px-12 flex flex-col items-center relative overflow-hidden select-none"
    >
      {/* Background Interactive Shader Canvas */}
      <AboutBackgroundCanvas />

      {/* Fade shaders and gradient overlays for composition */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_40%,_rgba(0,0,0,0.95)_110%)] pointer-events-none z-0" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black to-transparent pointer-events-none z-0" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-0" />

      {/* Balanced 3-Column Creative Layout */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-14 relative z-10 pt-4">

        {/* COLUMN 1: Visual Identity and Face Asset */}
        <div className="reveal-section-col lg:col-span-4 flex flex-col animate-fadeIn relative group">
          {/* Subtle responsive glowing aura behind the portrait matching the lighting in the photo */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-red-500/10 to-transparent rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-1000 pointer-events-none z-0" />

          <div className="relative w-full overflow-hidden aspect-[3/4] bg-black rounded-[2rem] border border-zinc-900/40 z-10">
            {/* Displaying original high-fidelity uploaded portrait with selective red-lighting */}
            <motion.img
              src="../src/assets/images/me.png"
              alt="Sohaib Elahi Portrait"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-[2rem] transition-transform duration-1000 ease-out group-hover:scale-105"
            />
            {/* Ultimate edge-to-black gradient mask to seamlessly dissolve any photo boundaries into the page background */}
            <div className="absolute inset-0 pointer-events-none rounded-[2rem] shadow-[inset_0_0_60px_30px_#000000] sm:shadow-[inset_0_0_80px_40px_#000000]" />
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black to-transparent pointer-events-none rounded-b-[2rem]" />
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black to-transparent pointer-events-none rounded-t-[2rem]" />
          </div>
        </div>

        {/* COLUMN 2: Purposeful Narrative and Direct Contact Call */}
        <div className="reveal-section-col lg:col-span-4 flex flex-col justify-between pt-4 lg:pt-0">
          <div>
            <h2 className="text-4xl lg:text-5xl font-serif font-light tracking-tight text-white mb-6">
              About
            </h2>

            <div className="space-y-5 text-sm sm:text-[14.5px] text-zinc-300 font-light leading-relaxed font-sans">
              <p>
                I am a Brand, Web &amp; eCommerce Designer with a developer's mindset, bridging the gap between creative vision and technical execution. With 6+ years in design and 3+ years in development and AI/ML, I bring a rare blend of design artistry, logic, and intelligent automation.
              </p>
              <p>
                Holding a BS in Artificial Intelligence, I leverage state-of-the-art AI systems not as a shortcut, but as a creative multiplier to streamline workflows and automate content. My work focuses where design meets high-converting performance.
              </p>
              <p>
                From high-CTR Amazon listings and packaging design to bespoke email campaigns and interactive Three.js/React websites, I've designed and engineered digital assets for leading international brands in the US, UK, and UAE.
              </p>
            </div>
          </div>

          <div className="pt-8">
            <a
              href="mailto:sohaib.e0912003@gmail.com?subject=Inquiry / Collaboration"
              className="inline-flex items-center gap-2.5 px-6 py-3 border border-zinc-700/80 rounded-full bg-white text-black hover:bg-accent-red hover:text-white hover:border-accent-red transition-all duration-300 text-xs font-semibold tracking-wider uppercase cursor-none shadow-lg"
              data-cursor="pointer"
            >
              Get in Touch <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* COLUMN 3: Chronology Experience Log and Skills Matrix */}
        <div className="reveal-section-col lg:col-span-4 flex flex-col gap-10 pt-4 lg:pt-0">

          {/* PROFESSIONAL TIMELINE */}
          <div>
            <div className="pb-2 border-b border-zinc-800 mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Experience
              </span>
            </div>

            <div className="space-y-4">
              {experienceList.map((item, idx) => (
                <div
                  key={`${item.title}-${idx}`}
                  className="group flex justify-between items-start py-1 last:border-0 hover:translate-x-1 transition-transform duration-300"
                >
                  <div className="flex flex-col pr-4">
                    <span className="text-sm font-medium text-white transition-colors duration-200">
                      {item.title}
                    </span>
                    <span className="text-[11.5px] text-zinc-400 mt-0.5">
                      {item.subtitle}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap pt-1">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVE DISCIPLINE PILLS */}
          <div>
            <div className="pb-2 border-b border-zinc-800 mb-4">
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Skills
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {skillsList.map((skill) => (
                <motion.span
                  key={skill}
                  whileHover={{
                    borderColor: "rgba(239, 68, 68, 0.4)",
                    backgroundColor: "rgba(239, 68, 68, 0.04)"
                  }}
                  transition={{ duration: 0.2 }}
                  className="px-3.5 py-1.5 text-[11px] text-zinc-300 bg-zinc-950 border border-zinc-800/80 rounded-full cursor-default select-none transition-colors duration-300"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
