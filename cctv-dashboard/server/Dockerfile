# server/Dockerfile - 백엔드 서버 Docker 이미지

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /app/db

EXPOSE 3001

CMD ["node", "index.js"]
