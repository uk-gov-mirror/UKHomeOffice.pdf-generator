FROM digitalpatterns/node:latest AS build

COPY . /src

WORKDIR /src

RUN yum install -y libX11-devel libX11-common libXcomposite libXcursor libXdamage libXext libXi libXtst cups-libs libXScrnSaver libXrandr alsa-lib atk at-spi2-atk cairo pango gtk3 java-1.8.0-openjdk
RUN npm install
# RUN npm run build-ts

# #RUN npm prune --production


# RUN chown -R node:node /src

# ENV NODE_ENV='production'

# USER 1000

# EXPOSE 8080

# ENTRYPOINT exec node dist/bootstrap.js

