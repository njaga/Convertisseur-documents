FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      libreoffice-core \
      libreoffice-writer \
      libreoffice-calc \
      libreoffice-impress \
      fonts-dejavu-core \
      fonts-liberation \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server.mjs ./server.mjs

ENV PORT=8080
ENV MAX_UPLOAD_BYTES=52428800
EXPOSE 8080

USER node
CMD ["node", "server.mjs"]
