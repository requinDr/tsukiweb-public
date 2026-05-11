# Docker deployment

All commands below must be run from this `docker/` directory.

## Docker Compose (recommended)

```sh
docker compose up -d --build
```

A version tag or commit hash can be specified:

```sh
VERSION=latest docker compose up -d --build
VERSION=v0.3.0 docker compose up -d --build
VERSION=da4ea4f docker compose up -d --build
```

## Docker CLI

```sh
docker build -t tsukiweb .
docker run -p 8080:80 tsukiweb
```

A version tag or commit hash can be specified as a build argument:

```sh
docker build --build-arg VERSION=latest -t tsukiweb .
docker build --build-arg VERSION=v0.3.0 -t tsukiweb .
docker build --build-arg VERSION=da4ea4f -t tsukiweb .
```

Navigate to http://localhost:8080 after deploying the container.
