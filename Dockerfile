FROM node:lts-alpine as build
COPY . /src
WORKDIR /src
RUN set -eux ; \
  apk update ; \
  apk add --no-cache \
  libx11 \
  libx11-dev \
  libx11-static \
  libxcomposite \
  libxcursor \
  libxdamage \
  libxext \
  libxi \
  libxtst \
  cups-libs \
  libxscrnsaver \
  libxrandr \
  alsa-lib \
  atk \
  at-spi2-atk \
  cairo \
  pango \
  gtk+3.0 \
  openjdk8 \
  py2-pip \
  bash \
  libc6-compat \
  gcompat \
  libgcc \
  libstdc++6 \
  libstdc++ \
  build-base \
  libtool \
  autoconf \
  automake \
  libexecinfo-dev \
  git \
  python ; \
  rm -rf /var/cache/apk/* ; \
  npm ci ; \
  npm run build-ts ; \
  npm prune --production


FROM node:lts-alpine as pdf-generator
ENV CHROME_BIN="/usr/bin/chromium-browser"
ENV NODE_ENV='production'
RUN set -eux ; \
  apk update ; \
  echo @edge http://dl-cdn.alpinelinux.org/alpine/v3.8/community >> /etc/apk/repositories ; \
  echo @edge http://dl-cdn.alpinelinux.org/alpine/v3.8/main >> /etc/apk/repositories ; \
  apk add --no-cache \
  chromium@edge \
  nss@edge \
  libx11 \
  libx11-dev \
  libx11-static \
  libxcomposite \
  libxcursor \
  libxdamage \
  libxext \
  libxi \
  libxtst \
  cups-libs \
  libxscrnsaver \
  libxrandr \
  alsa-lib \
  atk \
  at-spi2-atk \
  cairo \
  pango \
  gtk+3.0 \
  openjdk8 \
  redis \
  stunnel ; \
  rm -rf /var/cache/apk/* ; \
  mkdir -p /app

WORKDIR /app
COPY --from=build /src/node_modules /app/node_modules
COPY --from=build /src/dist /app/dist
RUN chown -R node:node /app
USER 1000
EXPOSE 8080
ENTRYPOINT exec node dist/bootstrap.js
