import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import ServicesBackgroundCanvas from "./ServicesBackgroundCanvas";

interface ServiceCard {
  number: string;
  title: string;
  pills: string[];
}

const servicesList: ServiceCard[] = [
  {
    number: "01",
    title: "brand design",
    pills: ["brand strategy", "visual identity", "brand guidelines", "rebranding"],
  },
  {
    number: "02",
    title: "web design",
    pills: ["custom website", "responsive web", "ui/ux design", "shopify store"],
  },
  {
    number: "03",
    title: "amazon design",
    pills: ["infographics", "A+ content", "listing optimization", "conversion branding"],
  },
  {
    number: "04",
    title: "marketing design",
    pills: ["email layouts", "klaviyo automations", "ad creatives", "retention marketing"],
  },
];

function ServiceCardItem({ srv, idx, isDesktop }: { srv: ServiceCard; idx: number; isDesktop: boolean; key?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(5px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: false, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay: isDesktop ? idx * 0.08 : 0,
        ease: "easeOut",
      }}
      whileHover={isDesktop ? { y: -6, scale: 1.015 } : {}}
      className={`group relative bg-black/60 backdrop-blur-md border border-zinc-900 rounded-[24px] p-7 md:p-8 flex flex-col justify-between overflow-hidden transition-all duration-500 shadow-[0_4px_30px_rgba(0,0,0,0.4)] ${isDesktop ? 'min-h-[290px] hover:border-[#ef4444]/35' : 'h-[290px]'}`}
    >
      {/* Internal subtle custom glow behind content */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(239,68,68,0.035)_0%,_rgba(0,0,0,0)_65%)] opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Glow border ring on hover */}
      <div className="absolute inset-[1px] rounded-[23px] bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none group-hover:from-[#ef4444]/10 transition-colors duration-500" />

      {/* TOP ROW: Title and number */}
      <div className="w-full relative z-10">

        {/* Number */}
        <div className="font-sans font-normal text-white text-2xl tracking-tight mb-7 group-hover:text-white transition-colors duration-500">
          {srv.number}
        </div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-['Apple_Garamond',_Garamond,_'Baskerville',_serif] text-white leading-snug tracking-wide group-hover:text-white transition-colors duration-500 capitalize">
          {srv.title}
        </h3>

      </div>

      {/* BOTTOM ROW: Tags */}
      <div className="w-full flex flex-col gap-6 mt-6 relative z-10">
        <div className="flex flex-wrap gap-2">
          {srv.pills.slice(0, 3).map((pill) => (
            <span
              key={pill}
              className="px-2.5 py-1 text-[10px] font-sans font-normal tracking-[0.05em] text-white bg-[#070708] border border-zinc-900/90 rounded-full transition-all duration-300 hover:border-white/40 hover:text-white group-hover:bg-zinc-950 capitalize bg-white/5"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function InteractiveServicesGrid() {
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;

    let minDiff = Infinity;
    let closestIndex = 0;

    const containerCenter = scrollLeft + container.clientWidth / 2;

    Array.from(container.children).forEach((child, index) => {
      const childElement = child as HTMLElement;
      // Since container is relative or similar, we calculate its center
      const childCenter = childElement.offsetLeft + childElement.clientWidth / 2;
      const diff = Math.abs(containerCenter - childCenter);

      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeSlide) {
      setActiveSlide(closestIndex);
    }
  };

  const scrollToSlide = (idx: number) => {
    if (!carouselRef.current) return;
    const childElement = carouselRef.current.children[idx] as HTMLElement;
    if (childElement) {
      // scroll to center child
      const scrollPos = childElement.offsetLeft - (carouselRef.current.clientWidth / 2) + (childElement.clientWidth / 2);
      carouselRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="services-grid-section"
      className="w-full bg-black text-white py-24 px-6 md:px-12 flex flex-col items-center relative overflow-hidden select-none"
    >
      {/* Interactive shader background */}
      <ServicesBackgroundCanvas />

      {/* Extra safety vignette overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_40%,_rgba(0,0,0,0.85)_110%)] pointer-events-none z-0" />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black to-transparent pointer-events-none z-0" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-0" />

      <div className="w-full max-w-7xl mx-auto flex flex-col gap-16 relative z-10">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-6 border-b border-zinc-900">
          <div>
            <span className="text-[10px] font-sans font-normal tracking-[0.25em] text-white uppercase block mb-2 lowercase">
              tailored to your standards
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-light tracking-tight leading-[1.05] lowercase text-white">
              services that <br />
              <span className="italic text-white font-serif">are tailored</span>
            </h2>
          </div>

          <div className="max-w-xs md:max-w-md">
            <p className="text-xs sm:text-sm text-white font-sans font-normal leading-relaxed transition-colors duration-300 lowercase">
              delivering hyper-customized high fidelity digital representations and marketing materials to grow online platforms. everything you need, engineered with precision.
            </p>
          </div>
        </div>

        {/* DESKTOP: 2 ROWS of 4 CARDS EACH - 8 total grid structure */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {servicesList.map((srv, idx) => (
            <ServiceCardItem key={srv.number} srv={srv} idx={idx} isDesktop={true} />
          ))}
        </div>

        {/* MOBILE: Scroll Snap Carousel */}
        <div className="flex flex-col w-full items-center relative md:hidden">
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="w-full flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 [&::-webkit-scrollbar]:hidden relative"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {servicesList.map((srv, idx) => (
              <div key={srv.number} className="snap-center shrink-0 w-[85vw] relative first:ml-0 last:mr-0">
                <ServiceCardItem srv={srv} idx={idx} isDesktop={false} />
              </div>
            ))}
          </div>

          {/* Dots Navigation */}
          <div className="flex items-center gap-2 mt-4 md:hidden">
            {servicesList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === idx ? "w-6 bg-[#ef4444]" : "w-1.5 bg-white/20"}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
