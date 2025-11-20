FROM node:20-bullseye

# 1. Install dependencies for Remotion (Chrome/FFmpeg)
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# 2. Set working directory
WORKDIR /app

# 3. Install Node dependencies
COPY package*.json ./
# Use legacy-peer-deps because of the zod conflict we saw earlier
RUN npm ci --legacy-peer-deps

# 4. Copy source code
COPY . .

# 5. Set environment variables for Remotion
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 6. Start the worker
# We use tsx directly to run the worker in production
CMD ["npx", "tsx", "src/workers/run.ts"]
