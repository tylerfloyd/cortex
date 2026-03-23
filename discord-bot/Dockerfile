FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
# Install all deps including devDeps (tsx is needed to run TypeScript directly)
RUN npm ci

COPY src/ ./src/
COPY tsconfig.json ./

ENV NODE_ENV=production

CMD ["npx", "tsx", "src/index.ts"]
