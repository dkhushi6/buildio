# Use the E2B base or Node image

FROM e2bdev/code-interpreter:latest

# or use Node

# FROM node:20-alpine

WORKDIR /home/user

# Initialize new React + Vite project (non-interactive)

RUN npx --yes create-vite@latest myapp --template react-ts && \
      cp -rT myapp /home/user && \
      rm -rf myapp && \
      npm install

RUN npm install lucide-react

# Install TailwindCSS and dependencies

RUN npm install -D tailwindcss@3 postcss autoprefixer
RUN npx tailwindcss init -p
# Write root tsconfig.json WITH @/ paths — shadcn reads THIS file, not tsconfig.app.json
RUN printf '{\n  "compilerOptions": {\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["./src/*"]\n    }\n  },\n  "files": [],\n  "references": [\n    { "path": "./tsconfig.app.json" },\n    { "path": "./tsconfig.node.json" }\n  ]\n}\n' > tsconfig.json

# Write tsconfig.app.json WITH @/ alias
RUN printf '{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx",\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noFallthroughCasesInSwitch": true,\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["./src/*"]\n    }\n  },\n  "include": ["src"],\n  "references": [{ "path": "./tsconfig.node.json" }]\n}\n' > tsconfig.app.json

# Write components.json manually — skip broken `shadcn init`
RUN printf '{\n  "$schema": "https://ui.shadcn.com/schema.json",\n  "style": "default",\n  "rsc": false,\n  "tsx": true,\n  "tailwind": {\n    "config": "tailwind.config.js",\n    "css": "src/index.css",\n    "baseColor": "slate",\n    "cssVariables": true,\n    "prefix": ""\n  },\n  "aliases": {\n    "components": "@/components",\n    "utils": "@/lib/utils",\n    "ui": "@/components/ui",\n    "lib": "@/lib",\n    "hooks": "@/hooks"\n  },\n  "iconLibrary": "lucide"\n}\n' > components.json

# Install shadcn peer deps
RUN npm install class-variance-authority clsx tailwind-merge @radix-ui/react-slot

# Write src/lib/utils.ts
RUN mkdir -p src/lib && printf 'import { clsx, type ClassValue } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n' > src/lib/utils.ts

# Add all components — shadcn now resolves @/ → src/ via tsconfig.app.json
RUN npx --yes shadcn@latest add button card input label badge avatar \
 dialog sheet dropdown-menu select textarea checkbox radio-group \
 switch tabs accordion toast progress skeleton separator \
 alert form popover tooltip slider --overwrite
RUN npm install framer-motion react-router-dom recharts react-hook-form zod @tanstack/react-query
RUN npm install @fontsource-variable/inter @fontsource-variable/plus-jakarta-sans @fontsource-variable/geist

# --- Replace default Vite + Tailwind configs ---

# vite.config.js

RUN printf 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport path from "path";\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: {\n    alias: {\n      "@": path.resolve(__dirname, "./src"),\n    },\n  },\n  server: {\n    host: "0.0.0.0",\n    port: 5173,\n    strictPort: true,\n    allowedHosts: true,\n  },\n  preview: {\n    host: "0.0.0.0",\n    port: 5173,\n  },\n});\n' > vite.config.ts

# tailwind.config.js

RUN printf '/** @type {import("tailwindcss").Config} */\nexport default {\n  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],\n  theme: {\n    extend: {\n      fontFamily: {\n        sans: ["Inter Variable", "Plus Jakarta Sans Variable", "system-ui", "sans-serif"],\n        display: ["Plus Jakarta Sans Variable", "Inter Variable", "sans-serif"],\n        mono: ["Geist Variable", "ui-monospace", "monospace"],\n      },\n      colors: {\n        border: "hsl(var(--border))",\n        input: "hsl(var(--input))",\n        ring: "hsl(var(--ring))",\n        background: "hsl(var(--background))",\n        foreground: "hsl(var(--foreground))",\n        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },\n        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },\n        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },\n        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },\n        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },\n        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },\n        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },\n      },\n      borderRadius: {\n        lg: "var(--radius)",\n        md: "calc(var(--radius) - 2px)",\n        sm: "calc(var(--radius) - 4px)",\n      },\n    }\n  },\n  plugins: [],\n};\n' > tailwind.config.js

# src/index.css — overwrite with correct shadcn + Tailwind CSS (Vite default CSS has no @tailwind directives)
RUN printf '@import "@fontsource-variable/inter";\n@import "@fontsource-variable/plus-jakarta-sans";\n@import "@fontsource-variable/geist";\n\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n  :root {\n    --background: 0 0%% 100%%;\n    --foreground: 240 10%% 3.9%%;\n    --card: 0 0%% 100%%;\n    --card-foreground: 240 10%% 3.9%%;\n    --popover: 0 0%% 100%%;\n    --popover-foreground: 240 10%% 3.9%%;\n    --primary: 240 5.9%% 10%%;\n    --primary-foreground: 0 0%% 98%%;\n    --secondary: 240 4.8%% 95.9%%;\n    --secondary-foreground: 240 5.9%% 10%%;\n    --muted: 240 4.8%% 95.9%%;\n    --muted-foreground: 240 3.8%% 46.1%%;\n    --accent: 240 4.8%% 95.9%%;\n    --accent-foreground: 240 5.9%% 10%%;\n    --destructive: 0 84.2%% 60.2%%;\n    --destructive-foreground: 0 0%% 98%%;\n    --border: 240 5.9%% 90%%;\n    --input: 240 5.9%% 90%%;\n    --ring: 240 10%% 3.9%%;\n    --radius: 0.5rem;\n  }\n  .dark {\n    --background: 240 10%% 3.9%%;\n    --foreground: 0 0%% 98%%;\n    --card: 240 10%% 3.9%%;\n    --card-foreground: 0 0%% 98%%;\n    --popover: 240 10%% 3.9%%;\n    --popover-foreground: 0 0%% 98%%;\n    --primary: 0 0%% 98%%;\n    --primary-foreground: 240 5.9%% 10%%;\n    --secondary: 240 3.7%% 15.9%%;\n    --secondary-foreground: 0 0%% 98%%;\n    --muted: 240 3.7%% 15.9%%;\n    --muted-foreground: 240 5%% 64.9%%;\n    --accent: 240 3.7%% 15.9%%;\n    --accent-foreground: 0 0%% 98%%;\n    --destructive: 0 62.8%% 30.6%%;\n    --destructive-foreground: 0 0%% 98%%;\n    --border: 240 3.7%% 15.9%%;\n    --input: 240 3.7%% 15.9%%;\n    --ring: 240 4.9%% 83.9%%;\n  }\n}\n\n@layer base {\n  * {\n    @apply border-border;\n  }\n  body {\n    @apply bg-background text-foreground;\n    font-family: var(--font-sans);\n    -webkit-font-smoothing: antialiased;\n  }\n}\n\n:root {\n  --font-sans: "Inter Variable", "Plus Jakarta Sans Variable", system-ui, sans-serif;\n  --font-display: "Plus Jakarta Sans Variable", "Inter Variable", sans-serif;\n  --font-mono: "Geist Variable", ui-monospace, monospace;\n}\n\n#root {\n  min-height: 100vh;\n  width: 100%%;\n}\n' > src/index.css
