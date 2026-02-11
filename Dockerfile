FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=3000
ENV VIDEO_DIR=/data/videos

RUN mkdir -p /data/videos

EXPOSE 3000

CMD ["npm", "start"]
