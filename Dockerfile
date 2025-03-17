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

ARG CACHE_MAX_SIZE=-1
ARG CACHE_INACTIVE=-1
ENV CACHE_MAX_SIZE=${CACHE_MAX_SIZE}
ENV CACHE_INACTIVE=${CACHE_INACTIVE}

RUN CACHE_CMD="proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=asset_cache:10m"; \
    if [ "$CACHE_MAX_SIZE" != "-1" ]; then \
        CACHE_CMD="$CACHE_CMD max_size=$CACHE_MAX_SIZE"; \
    fi; \
    if [ "$CACHE_INACTIVE" != "-1" ]; then \
        CACHE_CMD="$CACHE_CMD inactive=$CACHE_INACTIVE"; \
    fi; \
    CACHE_CMD="$CACHE_CMD use_temp_path=off;"; \
    sed -i "/http {/a \ \ $CACHE_CMD" /etc/nginx/nginx.conf

COPY --from=builder /tsukiweb/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
