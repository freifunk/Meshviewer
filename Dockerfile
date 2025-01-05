### Build stage for the website frontend
FROM --platform=$BUILDPLATFORM node:23-bookworm-slim as build
RUN apt-get update && \
apt-get install -y python3
WORKDIR /code
COPY . ./
RUN npm install
RUN npm audit
RUN npm run lint
RUN npm run build

FROM nginx:1.27.3-alpine
COPY --from=build /code/build/ /usr/share/nginx/html
COPY --from=build /code/config.example.json /usr/share/nginx/html/
EXPOSE 80
