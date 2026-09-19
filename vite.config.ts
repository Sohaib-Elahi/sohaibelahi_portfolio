import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()], ssr: { noExternal: ['gsap', 'lenis'] }, build: { minify: 'terser', terserOptions: { compress: { passes: 3 } } } });
