FROM node:lts-buster

RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    libvips-dev \
    libwebp-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /sophia

COPY package*.json ./

RUN npm install

COPY . .

CMD ["pm2-runtime", "start", ".", "--name", "SOPHIA-MD", "--watch"]
