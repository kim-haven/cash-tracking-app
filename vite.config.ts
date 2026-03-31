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
    server: {
      proxy: {
        '/api': {
          target: env.CASH_TRACKING_APP_API ?? 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          // allow Laravel session cookies to work on the Vite origin
          cookieDomainRewrite: '',
        },
      },
    },
  }
})