FROM node:8.4.0

RUN apt-get update

RUN mkdir -p /app/user
WORKDIR /app/user

COPY package-lock.json .
COPY package.json .
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
