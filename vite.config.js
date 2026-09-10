import {defineConfig} from 'vite';
export default defineConfig({build:{rollupOptions:{input:{earth:'index.html',moon:'moon.html',solar:'solar.html'},output:{manualChunks:{three:['three']}}}}});
