import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, CheckCircle2, Menu } from "lucide-react";
import Lenis from "lenis";
import VectorNoiseCanvas from "./components/VectorNoiseCanvas";

import MarketingFeaturesSection from "./components/MarketingFeaturesSection";
import InteractiveServicesGrid from "./components/InteractiveServicesGrid";
import PortfolioScrollSection from "./components/PortfolioScrollSection";
import AboutSection from "./components/AboutSection";
import PreFooterCTA from "./components/PreFooterCTA";
import ImageMarquee from "./components/ImageMarquee";
import Footer from "./components/Footer";
import ScrollProgressBar from "./components/ScrollProgressBar";
import ResumePDFViewer from "./components/ResumePDFViewer";

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCvOpen, setIsCvOpen] = useState(false);

  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 150);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync scroll state with expanding
  useEffect(() => {
    if (!isScrolled) {
      setIsNavExpanded(false);
    }
  }, [isScrolled]);

  // Buttery Smooth Linear-Interpolated Dual Cursor System
  useEffect(() => {
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let dotX = -100;
    let dotY = -100;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInteractive = target.closest("button, a, input, textarea, select, [role='button'], [data-cursor='pointer']");
      if (isInteractive) {
        dot.classList.add("cursor-expand");
        ring.classList.add("cursor-expand");
      } else {
        dot.classList.remove("cursor-expand");
        ring.classList.remove("cursor-expand");
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });

    let animId: number;
    const updateCursor = () => {
      dotX += (mouseX - dotX) * 0.35;
      dotY += (mouseY - dotY) * 0.35;
      dot.style.left = `${dotX}px`;
      dot.style.top = `${dotY}px`;

      ringX += (mouseX - ringX) * 0.14;
      ringY += (mouseY - ringY) * 0.14;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;

      animId = requestAnimationFrame(updateCursor);
    };
    updateCursor();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Initialize Lenis for buttery smooth scrolling (desktop only — native scroll is faster on mobile)
  useEffect(() => {
    // On mobile, native scroll is handled by the OS compositor and is always smoother
    if (window.innerWidth < 768) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    // Pause Lenis when PDF viewer is open so background never scrolls
    const onPdfOpen = () => lenis.stop();
    const onPdfClose = () => lenis.start();
    window.addEventListener("pdf-viewer-open", onPdfOpen);
    window.addEventListener("pdf-viewer-close", onPdfClose);

    let frameId: number;
    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }

    frameId = requestAnimationFrame(raf);

    return () => {
      window.removeEventListener("pdf-viewer-open", onPdfOpen);
      window.removeEventListener("pdf-viewer-close", onPdfClose);
      lenis.destroy();
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#000000] text-[#ffffff] relative font-sans select-none flex flex-col justify-between custom-cursor-active">

      {/* PERFECT ZERO-JITTER DUAL LERP CUSTOM CURSORS */}
      <ScrollProgressBar />

      <div
        ref={cursorDotRef}
        className="custom-cursor-dot hidden md:block"
        style={{ left: "-100px", top: "-100px" }}
      />
      <div
        ref={cursorRingRef}
        className="custom-cursor-ring hidden md:block"
        style={{ left: "-100px", top: "-100px" }}
      />

      {/* SCROLLABLE MASK WRAPPER THAT REVEALS FIXED FOOTER AT BOTTOM */}
      <div className="relative z-10 bg-black shadow-[0_30px_60px_rgba(0,0,0,0.95)]">
        {/* 1. HIGH-PRECISION GLASSMORPHISM PILL HEADER WITH DYNAMIC DE-SHRINKING INTERACTIVE HOVER & PRESS */}
        <motion.header
          initial={false}
          animate={isMobile ? {
            // Mobile: always a compact pill, but expands when nav is open
            width: isNavExpanded ? "92%" : 175,
            maxWidth: isNavExpanded ? 400 : 175,
            height: isNavExpanded ? 300 : 46,
            paddingLeft: 16,
            paddingRight: 12,
            borderRadius: isNavExpanded ? 24 : 9999,
          } : {
            // Desktop: full-width pill that shrinks after scroll
            width: (isScrolled && !isNavExpanded) ? 175 : "92%",
            maxWidth: (isScrolled && !isNavExpanded) ? 175 : 1024,
            height: isScrolled && !isNavExpanded ? 46 : 64,
            paddingLeft: (isScrolled && !isNavExpanded) ? 16 : 24,
            paddingRight: (isScrolled && !isNavExpanded) ? 12 : 24,
            borderRadius: 9999,
          }}
          transition={{
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1]
          }}
          className="fixed top-4 left-1/2 z-40 bg-black/20 backdrop-blur-[20px] border border-white/[0.1] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_24px_rgba(0,0,0,0.15)] flex flex-col justify-center select-none pointer-events-auto overflow-hidden whitespace-nowrap"
          style={{ x: "-50%" }}
        >
          {/* MOBILE NAV: Always compact pill, expands on hamburger tap (no scroll required) */}
          {isMobile ? (
            <>
              {/* Mobile Top Row: Logo + Hamburger/Close - ALWAYS VISIBLE */}
              <div className="flex flex-row items-center justify-between w-full h-8 px-1 shrink-0">
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setIsNavExpanded(false);
                  }}
                  className="font-serif text-white tracking-[0.02em] text-[13px] hover:text-accent-red transition-colors duration-200 shrink-0 select-none cursor-pointer text-left"
                >
                  Sohaib Elahi
                </button>
                <button
                  onClick={() => setIsNavExpanded(v => !v)}
                  className="flex items-center justify-center p-1.5 text-white hover:text-accent-red transition-colors rounded-full cursor-pointer shrink-0"
                  aria-label={isNavExpanded ? "Close menu" : "Open menu"}
                >
                  {isNavExpanded ? <X size={15} strokeWidth={2.5} /> : <Menu size={15} strokeWidth={2.5} />}
                </button>
              </div>

              {/* Mobile Expanded Links */}
              {isNavExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col gap-4 pt-4 pb-2 pl-1 w-full"
                >
                  {[
                    { label: "About", id: "about-section" },
                    { label: "Services", id: "services-section" },
                    { label: "Portfolio", id: "portfolio-section" },
                  ].map(({ label, id }) => (
                    <button
                      key={id}
                      onClick={() => {
                        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                        setIsNavExpanded(false);
                      }}
                      className="text-[15px] font-serif tracking-[0.05em] capitalize text-zinc-300 hover:text-white transition-colors duration-200 cursor-pointer text-left font-medium whitespace-nowrap"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="flex flex-row gap-3 pt-1 flex-wrap">
                    <button
                      onClick={() => { setIsCvOpen(true); setIsNavExpanded(false); }}
                      className="border border-accent-red/40 hover:border-accent-red text-white text-[12px] capitalize font-serif px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer font-bold tracking-[0.05em] whitespace-nowrap"
                    >
                      View CV
                    </button>
                    <a
                      href="mailto:sohaib.e0912003@gmail.com?subject=Project Inquiry / Collaboration"
                      onClick={() => setIsNavExpanded(false)}
                      className="text-[12px] capitalize bg-white text-black hover:bg-accent-red hover:text-white px-4 py-1.5 rounded-full transition-all duration-300 select-none active:scale-95 shrink-0 text-center font-serif font-bold tracking-[0.05em] whitespace-nowrap"
                    >
                      Work With Me
                    </a>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            /* DESKTOP NAV */
            <>
              {isScrolled && !isNavExpanded ? (
                /* --- DESKTOP SHRUNK CAPSULE STATE --- */
                <div className="flex flex-row items-center justify-between w-full h-8 px-1">
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      setIsNavExpanded(false);
                    }}
                    className="font-serif text-white tracking-[0.02em] text-[13px] hover:text-accent-red transition-colors duration-200 shrink-0 select-none cursor-none text-left"
                  >
                    Sohaib Elahi
                  </button>
                  <button
                    onClick={() => setIsNavExpanded(true)}
                    className="flex items-center justify-center p-1.5 text-white hover:text-accent-red transition-colors rounded-full cursor-none shrink-0"
                  >
                    <Menu size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                /* --- DESKTOP EXPANDED / NORMAL STATE --- */
                <div className="flex flex-row items-center w-full justify-between h-full">
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      setIsNavExpanded(false);
                    }}
                    className="font-serif text-white tracking-[0.02em] text-[15px] hover:text-accent-red transition-colors duration-200 shrink-0 select-none cursor-none pl-1 text-left"
                  >
                    Sohaib Elahi
                  </button>

                  {/* Desktop Links */}
                  <div className="flex flex-row items-center gap-8">
                    {[
                      { label: "About", id: "about-section" },
                      { label: "Services", id: "services-section" },
                      { label: "Portfolio", id: "portfolio-section" },
                    ].map(({ label, id }) => (
                      <button
                        key={id}
                        onClick={() => {
                          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                          setIsNavExpanded(false);
                        }}
                        className="text-[16px] font-serif tracking-[0.05em] capitalize text-zinc-300 hover:text-white transition-colors duration-200 cursor-none font-medium"
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Desktop Right Buttons */}
                  <div className="flex flex-row items-center gap-4 pr-1">
                    <button
                      onClick={() => { setIsCvOpen(true); setIsNavExpanded(false); }}
                      className="border border-accent-red/40 hover:border-accent-red text-white text-[14px] capitalize font-serif px-5 py-2 rounded-full transition-all duration-300 cursor-none font-bold tracking-[0.05em]"
                    >
                      View Cv
                    </button>
                    <a
                      href="mailto:sohaib.e0912003@gmail.com?subject=Project Inquiry / Collaboration"
                      onClick={() => setIsNavExpanded(false)}
                      className="cursor-none text-[14px] capitalize bg-white text-black hover:bg-accent-red hover:text-white px-5 py-2 rounded-full transition-all duration-300 select-none shadow-[0_0_15px_rgba(255,255,255,0.15)] active:scale-95 shrink-0 text-center font-serif font-bold tracking-[0.05em]"
                    >
                      Work With Me
                    </a>
                    {isScrolled && (
                      <button
                        onClick={() => setIsNavExpanded(false)}
                        className="flex items-center justify-center p-1.5 text-zinc-400 hover:text-accent-red transition-colors rounded-full cursor-none shrink-0"
                      >
                        <X size={16} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.header>

        {/* MAIN CONTAINER */}
        <main className="w-full relative flex-1">

          {/* SECTION 1: HERO CONTAINER (CENTRED VERTICALLY & HORIZONTALLY) */}
          <section className="relative w-full h-screen min-h-[650px] flex flex-col justify-center items-center overflow-hidden z-30">

            {/* Underlay low-vibrancy high-depth WebGL shader simulation */}
            <VectorNoiseCanvas />



            {/* Glowing Atmosphere Aurora Spotlights (Inspired by Luke Baffait's designs) */}
            <div className="absolute inset-x-0 top-0 bottom-0 z-10 pointer-events-none overflow-hidden origin-center mix-blend-screen opacity-100">
              <div className="absolute top-[-20%] bottom-0 left-1/2 -translate-x-1/2 w-[90%] sm:w-[60%] bg-[radial-gradient(ellipse_at_top,_rgba(239,68,68,0.15)_0%,_rgba(185,28,28,0.04)_45%,_rgba(0,0,0,0)_70%)] filter blur-[50px] sm:blur-[70px]" />
              <div className="absolute top-0 bottom-[-10%] left-1/2 -translate-x-1/2 w-[70%] sm:w-[45%] bg-[radial-gradient(ellipse_at_center,_rgba(224,36,36,0.15)_0%,_rgba(153,27,27,0.04)_50%,_rgba(0,0,0,0)_75%)] filter blur-[70px] sm:blur-[90px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_30%,_rgba(0,0,0,0.85)_105%)]" />
            </div>

            {/* Solid seamless fade to pure black at the bottom of the hero to prevent any background edge breaks */}
            <div className="absolute inset-x-0 bottom-0 h-32 lg:h-40 bg-gradient-to-t from-black via-black/50 to-transparent z-15 pointer-events-none" />

            {/* PERFECTLY CENTERED HERO CONTENT */}
            <div className="relative z-20 text-center max-w-full lg:max-w-7xl px-4 sm:px-8 flex flex-col items-center select-none">

              {/* Centered Name styling in gorgeous full serif layout */}
              <h1 className="flex flex-wrap items-baseline justify-center gap-x-1.5 sm:gap-x-3.5 text-[9.5vw] xs:text-[8.5vw] sm:text-[7vw] md:text-[6.2vw] lg:text-[5.5vw] xl:text-[5vw] font-thin leading-none tracking-tighter mb-8 filter drop-shadow-[0_10px_35px_rgba(239,68,68,0.1)]" style={{ fontWeight: 100 }}>
                <span className="font-serif font-thin text-white tracking-[-0.02em] hover:text-accent-red transition-colors duration-300">Creativity</span>
                <span className="font-serif font-thin text-white tracking-[-0.02em] hover:text-accent-red transition-colors duration-300">Comes</span>
                <span className="font-serif font-thin text-white tracking-[-0.02em] hover:text-accent-red transition-colors duration-300">From</span>
                <span className="font-serif italic font-thin text-[#daebe9] tracking-[-0.01em] hover:text-accent-red transition-colors duration-300">Within.</span>
              </h1>

              {/* 2-line Introductory Body Text in Clean Sans-Serif Font with elegant inline serif italic styling (Solid 100% white) positioned below the name */}
              <p className="font-sans text-xs sm:text-sm md:text-base text-white font-medium tracking-[0.03em] max-w-2xl mx-auto leading-relaxed mb-8 px-4">
                Designer with a <span className="font-serif italic text-white font-semibold flex-inline items-center pt-1 inline-block">developer's mindset</span>,<br className="hidden sm:inline" />
                crafting high-converting brand identities, email campaigns, and ecommerce creative systems.
              </p>


              <button
                onClick={() => {
                  const target = document.querySelector(".intro-section-container");
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="px-6 py-2.5 bg-white text-black font-serif text-[13.5px] sm:text-[14.5px] capitalize rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] hover:bg-accent-red hover:text-white transition-all duration-300 active:scale-95 cursor-none font-bold tracking-[0.02em]"
              >
                Explore More
              </button>
            </div>
          </section>

          {/* INFINITE AESTHETIC IMAGE MARQUEE TRANSITION */}
          <div id="portfolio-section">
            <ImageMarquee />
          </div>

          {/* SECTION 2: MARKETING & STATS */}
          <div className="intro-section-container relative w-full flex flex-col justify-start items-center z-20 overflow-hidden bg-black">
            <MarketingFeaturesSection />
          </div>

          {/* SECTION 3: INTERACTIVE SERVICES GRAPHIC CARD GRID */}
          <div id="services-section">
            <InteractiveServicesGrid />
          </div>

          {/* SECTION 3.5: SCROLL-BASED IMAGES PORTFOLIO CARDS */}
          <PortfolioScrollSection />

          {/* SECTION 4: ABOUT, EXPERIENCE, AWARDS, SKILLS GRID */}
          <div id="about-section">
            <AboutSection />
          </div>

          {/* SECTION 5: PRE-FOOTER CTA ANIMATED MARQUEE */}
          <PreFooterCTA />

        </main>

      </div> {/* END OF SCROLLABLE MASK WRAPPER */}

      {/* LUXURY INTERACTIVE REVEAL FOOTER */}
      <Footer />

      {/* CUSTOM THEMED PDF RESUME VIEWER */}
      <ResumePDFViewer isOpen={isCvOpen} onClose={() => setIsCvOpen(false)} />

    </div>
  );
}
