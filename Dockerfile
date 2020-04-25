FROM node:12
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build:ssr

FROM node:12
WORKDIR /app
COPY --from=0 /app/dist ./dist
ENV PORT=80
CMD ["node", "dist/text-racer/server/main.js"]
EXPOSE 80
