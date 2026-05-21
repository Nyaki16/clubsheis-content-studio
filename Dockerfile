# Render.com-friendly Docker image with the system libraries Remotion's
# headless Chrome needs at runtime, plus fonts so on-screen text renders.

FROM node:20-bookworm-slim

# System deps for Chromium (Remotion downloads its own browser binary, but
# it still needs these shared libraries at runtime) + fonts for rendering.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies. Copy lockfiles first so this layer caches well.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the project and build.
COPY . .
RUN npm run build

# Pre-bundle the Remotion composition so the running container doesn't need
# to spin up webpack at first render (~200 MB peak memory + 30 s saved).
RUN node scripts/build-remotion-bundle.mjs

# Render injects PORT. Default to 3000 if running outside Render.
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "npm start -- -p ${PORT:-3000}"]
