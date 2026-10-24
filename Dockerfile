FROM node:22-alpine AS build

WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build


FROM node:22-alpine

WORKDIR /app

COPY --from=build /build/dist ./dist
COPY --from=build /build/scripts ./scripts
COPY --from=build /build/package*.json ./

RUN npm ci --omit=dev

RUN mkdir -p \
    /etc/jellytube \
    /app/runtime \
    /app/screenshots

ENV NODE_ENV=production
ENV JELLYTUBE_HOST=0.0.0.0
ENV JELLYTUBE_PORT=4173
ENV JELLYTUBE_DIST=/app/dist
ENV JELLYTUBE_RUNTIME_DIR=/app/runtime

EXPOSE 4173

CMD ["node", "scripts/serve-dist.mjs"]
