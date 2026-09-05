FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm ci || npm install \
  && npm run build \
  && npm prune --omit=dev

ENV PORT=8787
ENV HOST=0.0.0.0

EXPOSE 8787

CMD ["npm", "start"]
