FROM node:lts-jod AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --no-cache

COPY . .

RUN npm run build


FROM node:lts-jod AS production

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./

RUN npm ci --no-cache --omit dev

COPY --from=build /app/dist ./dist

USER node:node

CMD ["node", "dist/main"]
