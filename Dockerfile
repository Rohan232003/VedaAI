# Use an official Node.js runtime as a parent image
FROM node:18-bullseye-slim

# Install Google Chrome Stable and fonts for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the apps
RUN npx turbo run build

# Expose the port the app runs on
EXPOSE 5000

# Start the server
CMD ["npm", "run", "start", "--workspace=apps/server"]
