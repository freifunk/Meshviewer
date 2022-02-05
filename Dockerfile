### Build stage for the website frontend
FROM --platform=$BUILDPLATFORM node:17.4.0-bullseye
RUN apt-get update && \
apt-get install python
WORKDIR /code
COPY package*.json ./
RUN npm ci --no-audit --prefer-offline
RUN npm run gulp
RUN npm run build

CMD ["npm" "start"]