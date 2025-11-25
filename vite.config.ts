import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This allows using process.env.API_KEY in your App code
      // We check for GEMINI_API_KEY first (as requested), then fall back to API_KEY
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY)
    }
  }
})