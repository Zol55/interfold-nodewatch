FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --omit=optional
COPY --from=build /app/dist ./dist

EXPOSE 9464
ENTRYPOINT ["node", "dist/cli.js"]
CMD ["exporter"]
