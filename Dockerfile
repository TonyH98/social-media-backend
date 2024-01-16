FROM node

WORKDIR /app

COPY . .

RUN npm install

RUN npm rebuild bcrypt --build-from-source

EXPOSE 3333

CMD ["node", "server.js"]