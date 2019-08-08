FROM node:11

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 8080

CMD [ "npx", "probot", "." ]
