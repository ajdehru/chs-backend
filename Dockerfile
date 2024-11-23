FROM node:20-alpine
WORKDIR /app
RUN npm install --global pm2

COPY ./package.json ./

RUN npm i

COPY ./ ./

EXPOSE 5000

CMD [ "pm2-runtime", "start", "npm", "--", "run", "start" ]