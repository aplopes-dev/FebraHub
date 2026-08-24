# Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
# package-lock.json é gitignored pela política do monorepo (pnpm) — sem lockfile aqui
COPY package.json ./
RUN npm install --no-audit --no-fund

# Development
FROM deps AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build
FROM deps AS build
COPY . .
RUN npm run build

# Production
FROM nginx:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
