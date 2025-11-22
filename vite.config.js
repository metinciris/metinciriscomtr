import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: If deploying to https://<USERNAME>.github.io/<REPO>/, set base to '/<REPO>/'
  // base: '/yenisitem/', 
})
