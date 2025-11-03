FROM e2bdev/code-interpreter:latest 

# Set working directory
WORKDIR /home/user

# Install Vite (React template) and TailwindCSS
RUN yes "no" | npm create vite@latest . -- --template react && \
    npm install
RUN npm install -D tailwindcss postcss autoprefixer
RUN npx tailwindcss init -p
RUN npm install lucide-react 

#add vite config file
# Use the E2B base or Node image
FROM e2bdev/code-interpreter:latest
# or use Node
# FROM node:20-alpine

WORKDIR /app

# Initialize new React + Vite project (non-interactive)
RUN yes "no" | npm create vite@latest . -- --template react

# Install TailwindCSS and dependencies
RUN npm install -D tailwindcss@3 postcss autoprefixer
RUN npx tailwindcss init -p

# --- Replace default Vite + Tailwind configs ---

# vite.config.js
RUN echo 'import { defineConfig } from "vite";\n\
import react from "@vitejs/plugin-react";\n\
\n\
export default defineConfig({\n\
  plugins: [react()],\n\
  server: {\n\
    host: "0.0.0.0",\n\
    port: 5173,\n\
    strictPort: true,\n\
  },\n\
  preview: {\n\
    host: "0.0.0.0",\n\
    port: 5173,\n\
  },\n\
});' > vite.config.js

# tailwind.config.js
RUN echo '/** @type {import("tailwindcss").Config} */\n\
export default {\n\
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],\n\
  theme: {\n\
    extend: {\n\
      colors: {\n\
        primary: "#3b82f6",\n\
        secondary: "#6366f1",\n\
      },\n\
    },\n\
  },\n\
  plugins: [],\n\
};' > tailwind.config.js
# src/index.css
RUN echo '@tailwind base;\n\
@tailwind components;\n\
@tailwind utilities;\n\
\n\
body {\n\
  @apply bg-gray-50 text-gray-800;\n\
}' > src/index.css