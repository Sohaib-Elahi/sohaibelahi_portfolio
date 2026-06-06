import React, { useEffect, useState, useRef, useCallback } from "react";
import * as pdfjs from "pdfjs-dist";
import { motion, AnimatePresence } from "motion/react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import resumePdf from "../assets/resume/sohaib-resume-2026.pdf";

// ── Worker ───────────────────────────────────────────────────────────────────
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// ─────────────────────────────────────────────────────────────────────────────

interface ResumePDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResumePDFViewer({ isOpen, onClose }: ResumePDFViewerProps) {
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Default zoom ───────────────────────────────────────────────────────────
  const defaultZoom = useCallback(() => {
    if (typeof window === "undefined") return 1.25;
    if (window.innerWidth < 640) return 0.55;
    if (window.innerWidth < 1024) return 0.9;
    return 1.25;
  }, []);

  const zoomPct = Math.round(zoom * 100);

  // ── Scroll lock: freeze body AND stop Lenis ────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Lock native scroll
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      // Dispatch custom event so App.tsx can pause Lenis
      window.dispatchEvent(new CustomEvent("pdf-viewer-open"));
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.dispatchEvent(new CustomEvent("pdf-viewer-close"));
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.dispatchEvent(new CustomEvent("pdf-viewer-close"));
    };
  }, [isOpen]);

  // ── Prevent wheel/touch events leaking through the backdrop ───────────────
  useEffect(() => {
    if (!isOpen) return;

    const stopPropagation = (e: Event) => {
      // Only block if the event target is NOT inside the scroll container
      if (scrollContainerRef.current?.contains(e.target as Node)) return;
      e.stopPropagation();
      e.preventDefault();
    };

    window.addEventListener("wheel", stopPropagation, { passive: false, capture: true });
    window.addEventListener("touchmove", stopPropagation, { passive: false, capture: true });

    return () => {
      window.removeEventListener("wheel", stopPropagation, { capture: true });
      window.removeEventListener("touchmove", stopPropagation, { capture: true });
    };
  }, [isOpen]);

  // ── Load PDF ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setPdf(null);

    const task = pdfjs.getDocument({ url: resumePdf, withCredentials: false });

    task.promise
      .then((doc) => {
        setPdf(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setZoom(defaultZoom());
        setLoading(false);
      })
      .catch((err) => {
        console.error("PDF load error:", err);
        setError("Failed to load the resume. Please try downloading it instead.");
        setLoading(false);
      });

    return () => {
      task.destroy().catch(() => {});
    };
  }, [isOpen, defaultZoom]);

  // ── Render page onto canvas ────────────────────────────────────────────────
  useEffect(() => {
    if (!pdf || !canvasRef.current || loading) return;

    const renderPage = async () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
      }

      try {
        const page = await pdf.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const vp = page.getViewport({ scale: zoom * dpr });
        const displayVp = page.getViewport({ scale: zoom });

        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.width = `${displayVp.width}px`;
        canvas.style.height = `${displayVp.height}px`;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const renderTask = page.render({ canvasContext: ctx, viewport: vp });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;

        // Reset scroll to top on page change
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Render error:", err);
        }
      }
    };

    renderPage();

    return () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
      }
    };
  }, [pdf, currentPage, zoom, loading]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape": onClose(); break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setCurrentPage(p => Math.min(numPages, p + 1)); break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setCurrentPage(p => Math.max(1, p - 1)); break;
        case "+": case "=": setZoom(z => Math.min(2.5, +(z + 0.15).toFixed(2))); break;
        case "-": setZoom(z => Math.max(0.4, +(z - 0.15).toFixed(2))); break;
        case "0": setZoom(defaultZoom()); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, numPages, onClose, defaultZoom]);

  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(numPages, p + 1));
  const zoomIn = () => setZoom(z => Math.min(2.5, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom(z => Math.max(0.4, +(z - 0.15).toFixed(2)));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="pdf-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
          style={{ cursor: "default" }}
          onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Dark frosted backdrop */}
          <div className="absolute inset-0 bg-black/88 backdrop-blur-xl pointer-events-none" />

          {/* Red ambient glow */}
          <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none"
            style={{ background: "rgba(201,54,46,0.07)" }} />
          <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none"
            style={{ background: "rgba(201,54,46,0.05)" }} />

          {/* ── Modal Panel ──────────────────────────────────────────────────── */}
          <motion.div
            key="pdf-panel"
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl h-[92vh] sm:h-[90vh] flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: "rgba(8,8,10,0.92)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 0 0 1px rgba(201,54,46,0.07), 0 30px 80px rgba(0,0,0,0.9), 0 0 60px rgba(201,54,46,0.08)",
              // Restore default cursor inside modal so the custom black cursor is visible on white PDF
              cursor: "default",
            }}
            onMouseDown={e => e.stopPropagation()}
          >

            {/* ── Top Control Bar ──────────────────────────────────────────── */}
            <div
              className="flex-shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 border-b"
              style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.5)" }}
            >
              {/* Document title */}
              <span className="text-[13px] sm:text-[14px] font-serif text-white font-medium tracking-wide">
                Sohaib Elahi — Résumé
              </span>

              {/* Page counter (desktop) */}
              {numPages > 0 && (
                <div
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <button disabled={currentPage <= 1} onClick={prevPage}
                    className="text-zinc-400 hover:text-white disabled:opacity-25 transition-colors p-0.5">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[11px] font-sans text-zinc-400 select-none px-0.5">
                    {currentPage} of {numPages}
                  </span>
                  <button disabled={currentPage >= numPages} onClick={nextPage}
                    className="text-zinc-400 hover:text-white disabled:opacity-25 transition-colors p-0.5">
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Zoom strip — desktop */}
                <div
                  className="hidden sm:flex items-center gap-0.5 px-1.5 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <button onClick={zoomOut}
                    className="p-1 text-zinc-400 hover:text-white transition-colors">
                    <ZoomOut size={13} />
                  </button>
                  <button onClick={() => setZoom(defaultZoom())} title="Reset zoom"
                    className="text-[10px] font-sans text-zinc-500 hover:text-zinc-300 transition-colors w-[34px] text-center">
                    {zoomPct}%
                  </button>
                  <button onClick={zoomIn}
                    className="p-1 text-zinc-400 hover:text-white transition-colors">
                    <ZoomIn size={13} />
                  </button>
                </div>

                {/* Download */}
                <a href={resumePdf} download="sohaib-resume-2026.pdf"
                  className="p-2 sm:p-2.5 rounded-full text-zinc-400 hover:text-white transition-all duration-200 group"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(201,54,46,0.4)")}
                  onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  <Download size={13} />
                </a>

                {/* Close */}
                <button onClick={onClose}
                  className="p-2 sm:p-2.5 rounded-full bg-white text-black hover:bg-[#c9362e] hover:text-white transition-all duration-200">
                  <X size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* ── Canvas Scroll Area ────────────────────────────────────────── */}
            {/*
              IMPORTANT: overflow-auto is on THIS div only.
              The outer modal has overflow-hidden so scroll is perfectly isolated.
              We also apply cursor: crosshair inside the scroll area to keep
              the custom cursor visible over the white PDF background.
            */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto overflow-x-auto flex justify-center items-start p-4 sm:p-8"
              style={{
                background: "rgba(5,5,7,0.7)",
                // Dark crosshair cursor is clearly visible on both white PDF and black background
                cursor: "crosshair",
                // Prevent this element's scroll from bubbling to window
                overscrollBehavior: "contain",
              }}
            >
              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-32">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#c9362e" }} />
                  <span className="text-[10px] font-sans text-zinc-500 uppercase tracking-[0.2em]">
                    Loading…
                  </span>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div className="flex flex-col items-center justify-center gap-4 text-center px-6 py-24">
                  <span className="text-zinc-400 font-serif text-base">{error}</span>
                  <a href={resumePdf} download="sohaib-resume-2026.pdf"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-[13px] font-serif font-bold rounded-full transition-colors duration-200"
                    style={{ background: "#c9362e" }}
                    onMouseOver={e => ((e.currentTarget as HTMLElement).style.background = "#ad2e27")}
                    onMouseOut={e => ((e.currentTarget as HTMLElement).style.background = "#c9362e")}
                  >
                    <Download size={13} /> Download PDF
                  </a>
                </div>
              )}

              {/* Canvas */}
              {!loading && !error && (
                <div style={{ filter: "drop-shadow(0 16px 48px rgba(0,0,0,0.85))" }}>
                  <canvas
                    ref={canvasRef}
                    className="block rounded-lg max-w-full"
                    style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                  />
                </div>
              )}
            </div>

            {/* ── Mobile Footer ─────────────────────────────────────────────── */}
            <div
              className="flex-shrink-0 flex sm:hidden items-center justify-between px-4 py-2.5 border-t"
              style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.5)" }}
            >
              {/* Mobile zoom */}
              <div className="flex items-center gap-2">
                <button onClick={zoomOut} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                  <ZoomOut size={13} />
                </button>
                <span className="text-[10px] font-sans text-zinc-500 w-8 text-center">{zoomPct}%</span>
                <button onClick={zoomIn} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                  <ZoomIn size={13} />
                </button>
              </div>

              {/* Mobile page nav */}
              {numPages > 1 && (
                <div className="flex items-center gap-2.5">
                  <button disabled={currentPage <= 1} onClick={prevPage}
                    className="px-3 py-1 text-[11px] font-sans text-zinc-400 hover:text-white disabled:opacity-25 transition-colors rounded-full"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                    ‹ Prev
                  </button>
                  <span className="text-[10px] font-sans text-zinc-500">{currentPage}/{numPages}</span>
                  <button disabled={currentPage >= numPages} onClick={nextPage}
                    className="px-3 py-1 text-[11px] font-sans text-zinc-400 hover:text-white disabled:opacity-25 transition-colors rounded-full"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                    Next ›
                  </button>
                </div>
              )}
            </div>

            {/* Keyboard hint */}
            {numPages > 1 && (
              <div className="absolute bottom-14 sm:bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                <span className="hidden sm:block text-[9px] font-sans text-zinc-700 tracking-widest uppercase select-none">
                  ← → navigate · +/− zoom · Esc close
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
