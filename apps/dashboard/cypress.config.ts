import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';
export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'cypress',
      bundler: 'vite',
      webServerCommands: {
        default: 'nx run dashboard:serve',
        production: 'nx run dashboard:serve:production',
      },
      ciWebServerCommand: 'nx run dashboard:serve-static',
    }),
  },
});
