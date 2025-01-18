# Meshviewer

[![Build Status](https://img.shields.io/github/actions/workflow/status/freifunk/meshviewer/build-meshviewer.yml?branch=main&style=flat-square)](https://github.com/freifunk/meshviewer/actions?query=workflow%3A%22Build+Meshviewer%22)
[![Release](https://img.shields.io/github/v/release/freifunk/meshviewer?style=flat-square)](https://github.com/freifunk/meshviewer/releases)
[![License: AGPL v3](https://img.shields.io/github/license/freifunk/meshviewer.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)

Meshviewer is an online visualization app to represent nodes and links on a map for Freifunk open mesh network.

## Installation

It is recommended to use the latest release:

- Go to the [release page](https://github.com/freifunk/meshviewer/releases) and download the current build
- Let your webserver serve this build
- Add a config.json to the webdir (based on config.example.json)

### Build yourself

- Clone this repository
- Run `npm install`
- Place your config file in `public/config.json`.
  You can copy the example config for testing/development: `cp config.example.json public/config.json`.
- Run `npm run build`
- A production build can then be found in [`/build`](./build)

Hint: You can start a development server with `npm run dev`

### Build and run using Docker

Static local test instance:

```bash
docker run -it --rm -u $(id -u):$(id -g) -v "$PWD":/app -w /app node npm install
docker run -it --rm -u $(id -u):$(id -g) -v "$PWD":/app -w /app node npm run build
docker run -it --rm -v "$PWD/build":/usr/share/nginx/html -p 8080:80 --name nginx nginx
```

The map is reachable at [localhost:8080](http://localhost:8080).
You have to copy `config.example.json` to `public/config.json`:

Start a development environment:

```bash
docker run -it --rm --name meshviewer-dev \
  -u $(id -u):$(id -g) \
  -v "$PWD":/app -w /app \
  -e NODE_ENV=development \
  -p 5173:5173 \
  node npm run dev -- --host 0.0.0.0
```

## Configuration

The configuration documentation is nowhere near finished.

### Deprecation and EOL Warning

Both the deprecation and the EOL warning can be turned off with `"deprecation_enabled": false` - but we wouldn't suggest it.

You can insert custom HTML into the deprecation and eol warning via `"deprecation_text":""` and `"eol_text":""` respectively.

## Development

To contribute to the project by developing new features, have a look at our [development documentation](DEVELOPMENT.md).

## History

Meshviewer started as [ffnord/meshviewer](https://github.com/ffnord/meshviewer) for Freifunk Nord
which was extended as [hopglass/hopglass](https://github.com/hopglass/hopglass)
and further expanded by Freifunk Regensburg as [ffrgb/meshviewer](https://github.com/ffrgb/meshviewer).
After maintenance stopped, Freifunk Frankfurt took over expanding the code base as [freifunk-ffm/meshviewer](https://github.com/freifunk-ffm/meshviewer)
and added features like the deprecation warnings.
It is now maintained by the Freifunk Org at [freifunk/meshviewer](https://github.com/freifunk/meshviewer).

## Goals

The goal for this project is to extend Meshviewer, pick off where other forks ended
and integrate those ideas into a code-base that is easily usable by all Freifunk communities.
This also has the benefit that everyone can take advantage of the bundled development resources
for implementing new features and fixing bugs.
