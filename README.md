# Splitwise to Toshl

This is a webapp that will take your expenses in splitwise and automatically input them into toshl.

Originally this was a command line application, but since python 3.12, something broke and I decided to rewrite it in a more modern way.

# Stack

Vite + React + TypeScript + TailwindCSS

Requires Node 20.0.0 or higher.

# Environments

## Development

Runs a vite server on port 5554, and an express server on 5544 which acts as a proxy for the toshl and splitwise APIs.

The vite dev server on 5554 has a proxy to port 5544 which allows the frontend to make requests to the backend on the same port.

## Production

After building the frontend, the express server will serve both the proxy and the frontend on port 5544.

This will then be copied into a docker container and deployed on the digital ocean server.

# Global requirements

Docker

# Development

Install dependencies

```
yarn
```

Run the frontend in one terminal

```
yarn dev
```

Run the server in another terminal

```
yarn dev:server
```

# Docker Deployment

Build the frontend

`yarn build`

Build the docker file

```
# Note: If running on an arm64 machine targetting a x86 machine, you need to build using the buildx command.

docker buildx create --name mybuilder --platform linux/amd64
docker buildx use mybuilder
docker buildx build --platform linux/amd64 -t splitwise-to-toshl .

# Otherwise the normal build command will work if you want to run it on your local machine or a server with the same architecture.

docker build -t splitwise-to-toshl .
```

Run the docker container and map the port (to make sure it's working)

`docker run -p 2922:2922 splitwise-to-toshl`

Save the docker image

`docker save -o splitwise-to-toshl.tar splitwise-to-toshl`

Upload the docker image to the server

`rsync -azP splitwise-to-toshl.tar user@your-server.com:/root/projects/splitwise-to-toshl/`

Load the docker image on the server

`docker load -i splitwise-to-toshl.tar`

Run the docker container on the server

`docker run -d -p 2567:2567 splitwise-to-toshl`

Accessing files in the container

`docker exec -it <container_id> /bin/bash`
