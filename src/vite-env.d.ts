/// <reference types="vite/client" />

// Treat PDF imports as URL strings (handled by Vite assetsInclude)
declare module "*.pdf" {
  const src: string;
  export default src;
}

