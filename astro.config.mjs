// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind'
import image from '@astrojs/image'

// https://astro.build/config
export default defineConfig({
    devToolbar: { enabled: false },
    integrations: [tailwind(), image()],
    site: "https://Davids-Berz.github.io",         // raíz del sitio
  base: "/roofing",
  trailingSlash: "ignore",
});
