FROM node:22

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --only=production

COPY . .

EXPOSE 19408 19001

ENV NODE_ENV=production

CMD ["node", "server.js"]





