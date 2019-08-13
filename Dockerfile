FROM node:11

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY dist dist/
COPY app.yml app.yml
EXPOSE 8080

CMD [ "npx", "probot", "run", "./dist" ]
