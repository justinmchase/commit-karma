FROM node:11

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm i

COPY . .
EXPOSE 8080

CMD [ "npx", "probot", "run", "dist" ]
