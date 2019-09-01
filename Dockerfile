FROM digitalpatterns/node:latest AS build

COPY . /src

WORKDIR /src

RUN yum install -y libX11-devel libX11-common
RUN npm install
RUN npm run build-ts

#RUN npm prune --production


RUN chown -R node:node /src

ENV NODE_ENV='production'

USER 1000

EXPOSE 8080

ENTRYPOINT exec node dist/bootstrap.js

