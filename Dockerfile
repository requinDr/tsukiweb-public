FROM node:22

RUN mkdir -p "/tsukiweb-public" \
    && git clone --recursive "https://github.com/requinDr/tsukiweb-public" "/tsukiweb-public"

WORKDIR "/tsukiweb-public"

RUN npm --loglevel verbose install

EXPOSE 5173

CMD [ "npm", "start", "--", "--host", "0.0.0.0", "--port=5173"]