import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(), // ✅ THIS LINE FIXES EVERYTHING
      babel({ presets: [reactCompilerPreset()] })
    ],
    define: {
      'import.meta.env.CASH_TRACKING_APP_API': JSON.stringify(
        env.CASH_TRACKING_APP_API ?? ''
      ),
    },
  }
})