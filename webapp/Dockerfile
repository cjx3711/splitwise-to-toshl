FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install --production --frozen-lockfile
COPY . .

FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=build /usr/src/app .
EXPOSE 5544
CMD ["node", "server.js"]
