# Web port
The goal is to provide an accessible modern way of reading an old, beautiful story.  
It includes QoL features such as savedata previews, an interactive flowchart, multiple languages support, and more.  

## Installation
The Progressive Web App (PWA) can be installed from the title screen using chromium-based browsers (_e.g._, Chrome, Edge, Opera).  
It offers a better experience in general.

## Local deployment
None of the original assets are provided with this repository.  
To download and run the game's code locally, follow one of the two methods:
### Node
1) install [`node.js`](https://nodejs.org/en/download) (version `18 / 20 / 22+` is required)
2) Get the source code: `git clone --recursive`
3) Install project dependencies with `npm i`
4) Start the localhost with `npm start`
5) Open your browser at the localhost address specified in the output of the previous command

### Docker
Alternatively, [`Docker`](https://docs.docker.com/get-started/get-docker/) can be used for local deployment.  
See [docker/README.md](docker/README.md) for full instructions (commands must be run from the `docker/` directory).

## Contributing
Anyone wanting to contribute can download the project and follow the roadmap, or do something else entirely.  
You can find our [contributing guidelines here](https://github.com/requinDr/tsukiweb-public/blob/main/CONTRIBUTING.md)

## Useful links
- [Recreating the resources](https://github.com/requinDr/tsukiweb-public/wiki/Recreating-the-resources)
- [Adding a translation](https://github.com/requinDr/tsukiweb-public/wiki/Adding-a-translation)

## Project technologies
- React (Vite)
- TypeScript
- SASS
