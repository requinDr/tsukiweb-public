FROM node:22 AS builder
WORKDIR /tsukiweb

ARG VERSION=latest

RUN git clone --tags https://github.com/requinDr/tsukiweb-public.git /tsukiweb \
    && cd /tsukiweb \
    && if [ "$VERSION" = "latest" ]; then \
        VERSION=$(git describe --tags $(git rev-list --tags --max-count=1)); \
      fi \
    && git checkout $VERSION \
    && git submodule update --init --recursive
RUN npm ci && npm run build

FROM nginx:stable-alpine AS production
WORKDIR /usr/share/nginx/html

COPY --from=builder /tsukiweb/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
