FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build


FROM node:22-alpine

WORKDIR /app

COPY --from=build /app .

RUN npm ci --omit=dev

ENV NODE_ENV=production
ENV JELLYTUBE_HOST=0.0.0.0
ENV JELLYTUBE_PORT=4173
ENV JELLYTUBE_DIST=/app/dist

EXPOSE 4173

CMD ["node", "scripts/serve-dist.mjs"]
