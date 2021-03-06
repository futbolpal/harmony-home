FROM heroku/heroku:16

RUN apt-get update
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash
RUN apt-get install -y nodejs

RUN mkdir -p /app/user
WORKDIR /app/user

ADD https://dl.google.com/gactions/updates/bin/linux/amd64/gactions/gactions gactions
RUN chmod +x gactions

COPY package-lock.json .
COPY package.json .
RUN npm install

COPY . .

CMD ["bash", "-c", "npm start"]
