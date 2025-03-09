#!/bin/bash

docker build -t tsukiweb .

# ------ deploy container/s ------

docker run -d \
  --name tsukiweb \
  -p 5173:5173 \
  --cap-add=NET_ADMIN \
  --restart=unless-stopped \
  tsukiweb

docker logs -f tsukiweb
