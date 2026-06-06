import React from "react";
import FooterCanvas from "./FooterCanvas";
import FooterSineWave from "./FooterSineWave";

export default function Footer() {
  // Handles smooth upward scroll back to the top of the page
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* 
        FOOTER SCROLL PLACEHOLDER (GAP CONTAINER)
        This spacer has the exact same height as the fixed footer underneath.
        As the user scrolls down, this relative spacer enters the viewport,
        revealing the beautiful fixed footer behind the normal scrolling content.
      */}
      <div className="relative w-full h-[85vh] min-h-[600px] pointer-events-none -z-10 bg-transparent" />

      {/* 
        ACTUAL FIXED FOOTER CONTAINER
        Fixed at the very bottom of the page, visible through the scrolling gap container above.
      */}
      <footer className="fixed bottom-0 left-0 w-full h-[85vh] min-h-[600px] bg-black z-0 flex flex-col justify-between py-12 px-6 sm:px-12 md:px-16 pointer-events-auto select-none overflow-hidden border-t border-white/[0.04]">

        {/* Soft interactive vector flow field canvas wave grid in the background */}
        <FooterCanvas />

        {/* Ambient Top Glow for subtle outline separation */}
        <div className="absolute top-0 inset-x-0 h-40 bg-[radial-gradient(ellipse_at_top,_rgba(239,68,68,0.06)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none" />

        {/* TOP ROW: BEAUTIFUL HORIZONTAL FLEX LINKS WITH FULL WHITE LABELS (NO ICONS, GREATER VISIBILITY) */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 relative z-20 pt-8 border-t border-white/[0.04]">

          {/* Column 1: Primary Contact Info (Serif Aesthetic, Highly Visible) */}
          <div className="flex flex-col gap-2 items-center md:items-start justify-start text-center md:text-left">
            <a
              href="mailto:sohaib.e0912003@gmail.com"
              className="text-base sm:text-lg font-serif italic text-white hover:text-accent-red transition-colors duration-200"
              data-cursor="pointer"
            >
              sohaib.e0912003@gmail.com
            </a>
            <span className="text-[11px] font-sans text-zinc-400 tracking-wider">
              &copy; 2026 &bull; Creative Developer Portfolio
            </span>
          </div>

          {/* Column 2: Horizontally Flexed Full-White Design Links (More Prominent, Beautiful Interaction) */}
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-8 gap-y-4 text-sm sm:text-[15px]">
            <a
              href="https://www.linkedin.com/in/sohaib-elahi2023/"
              target="_blank"
              rel="noreferrer"
              className="text-white hover:text-accent-red font-serif font-medium tracking-[0.05em] capitalize transition-all duration-300 relative group py-1"
              data-cursor="pointer"
            >
              Linkedin
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-accent-red group-hover:w-full transition-all duration-300" />
            </a>

            <a
              href="https://github.com/Sohaib-Elahi"
              target="_blank"
              rel="noreferrer"
              className="text-white hover:text-accent-red font-serif font-medium tracking-[0.05em] capitalize transition-all duration-300 relative group py-1"
              data-cursor="pointer"
            >
              Github
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-accent-red group-hover:w-full transition-all duration-300" />
            </a>

            <button
              onClick={() => {
                const target = document.querySelector(".intro-section-container");
                if (target) {
                  target.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="text-white hover:text-accent-red font-serif font-medium tracking-[0.05em] capitalize transition-all duration-200 cursor-none relative group py-1"
              data-cursor="pointer"
            >
              About &amp; Work
              <span className="absolute bottom-0 left-0 w-0 h-[1.2px] bg-accent-red group-hover:w-full transition-all duration-300" />
            </button>

            <button
              onClick={scrollToTop}
              className="text-accent-red hover:text-white font-serif font-bold tracking-[0.05em] capitalize transition-all duration-200 cursor-none py-1 flex items-center gap-1.5"
              data-cursor="pointer"
            >
              Back To Top &uarr;
            </button>
          </div>

        </div>

        {/* Beautiful borderless full-width particle sine wave flowing from right to left */}
        <FooterSineWave />

        {/* MIDDLE SECTION: SPACER */}
        <div className="flex-grow flex items-center justify-center w-full min-h-[300px] pointer-events-none" />

        {/* BOTTOM SECTION: GIGANTIC FULL-SCREEN WIDTH WORDMARK */}
        <div className="w-full relative z-10 select-none pb-10 sm:pb-8 md:pb-6">

          <div className="w-full flex justify-center items-end border-t border-white/[0.04] pt-8">
            <h2 className="w-full text-center font-serif font-light text-[12.5vw] xs:text-[12.5vw] md:text-[13vw] tracking-tighter leading-[1.1] flex items-baseline justify-center select-none text-white transition-all duration-500 hover:scale-[1.01] origin-bottom filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] mb-4 sm:mb-8 md:mb-6">
              {/* "Sohaib" regular luxury serif */}
              <span className="font-serif">Sohaib</span>

              {/* "Elahi" italicized Cupertino luxury serif */}
              <span className="font-serif italic pl-[2vw] text-zinc-100 italic-wordmark">Elahi</span>

              {/* Cupertino red dot matching Luke Baffait style */}
              <span className="text-[#c9362e] font-serif pr-[0.1em] font-medium leading-[0] drop-shadow-[0_0_20px_rgba(201,54,46,0.5)]">.</span>
            </h2>
          </div>

        </div>

      </footer>
    </>
  );
}
