# Web port of Tsukihime
The goal is to provide an accessible modern way of reading an old, beautiful story.  

## Installation
The Progressive Web App (PWA) can be installed from the title screen using chromium-based browsers (_e.g._, Chrome, Edge, Opera).  
It offers a better experience in general.

To download the source code and run the game locally, follow one of the two methods:
### Node
1) install [`node.js`](https://nodejs.org/en/download) (version `18 / 20 / 22+` is required)
2) Get the source code: `git clone --recursive`
3) Install project dependencies with `npm i`
4) Start the localhost with `npm start`
5) Open your browser at the localhost address specified in the output of the previous command

### Docker
Alternatively, [`Docker`](https://docs.docker.com/get-started/get-docker/) can be used for local deployment from a single command:
```
$ docker compose up -d
```

or, if you prefer to use the CLI,
```
$ docker build -t tsukiweb .
$ docker run -p 8080:80 tsukiweb
```
In addition, a version tag or commit hash can be specified as a build argument:
```
docker build --build-arg VERSION=latest -t tsukiweb
docker build --build-arg VERSION=v0.3.0 -t tsukiweb
docker build --build-arg VERSION=da4ea4f -t tsukiweb
```
In your browser, navigate to http://localhost:8080 after deploying the container.

## Roadmap
A roadmap is available here https://github.com/requinDr/tsukiweb-public/wiki

## Contributing
Anyone wanting to contribute can download the project and follow the roadmap, or do something else entirely.  
You can find our [contributing guidelines here](https://github.com/requinDr/tsukiweb-public/blob/main/CONTRIBUTING.md)

## Useful links
- [Adding a translation](https://github.com/requinDr/tsukiweb-public/wiki/Adding-a-translation)
- [Recreating the ressources](https://github.com/requinDr/tsukiweb-public/wiki/Recreating-the-ressources)

## Project technologies
- React (Vite)
- TypeScript
- SASS
