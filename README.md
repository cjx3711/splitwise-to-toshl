# Splitwise to Toshl

This is a webapp that will take your expenses in splitwise and automatically input them into toshl.

Originally this was a command line application, but since python 3.12, something broke and I decided to rewrite it in a more modern way.

# Repository Structure

- `splitwise-to-toshl/` — The main web application (Vite + React + TypeScript + MUI + Express)
- `old_python/` — Legacy CLI tool written in Python. No longer actively maintained but kept for reference. See its own [README](old_python/README.md) for usage instructions.

# Stack

Vite + React + TypeScript + MUI + Express

Requires Node 20.0.0 or higher.

# Environments

## Development

Runs a vite server on port 5554, and an express server on 5544 which acts as a proxy for the toshl and splitwise APIs.

The vite dev server on 5554 has a proxy to port 5544 which allows the frontend to make requests to the backend on port 5554.

## Production

After building the frontend, the express server will serve both the proxy and the frontend on port 5544. Since the server serves on port 5554, but all other routes will be directed to the /dist/ folder.

This will then be copied into a docker container and deployed on the digital ocean server.

# Global requirements

Docker

# Development

Install dependencies

```
yarn
```

Run the development frontend and server with one command

```
yarn dev
```

Alternatively, you could run them separately in two different terminals

```
yarn dev:client
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
docker buildx build --platform linux/amd64 -t splitwise-to-toshl . --load

# Otherwise the normal build command will work if you want to run it on your local machine or a server with the same architecture.

docker build -t splitwise-to-toshl .
```

Run the docker container and map the port to make sure it's working
(This works best if you built it on the same architecture. An ARM architecture can emulate an x86 one.)

`docker run -p 5544:5544 splitwise-to-toshl`

Save the docker image
(Make sure you built the image on the same architecture as the server)

`docker save -o splitwise-to-toshl.tar splitwise-to-toshl`

Upload the docker image to the server

`rsync -azP splitwise-to-toshl.tar <user>@<your-server>:/path/to/projects/splitwise-to-toshl/`

Delete the tar file

`rm splitwise-to-toshl.tar`

## On the server

Optional: Check if an existing container is running
`docker ps`

Optional: Stop the existing container
`docker stop <container_id>`
`docker rm <container_id>`

Load the docker image on the server

`docker load -i splitwise-to-toshl.tar`

Run the docker container on the server

`docker run -d -p 5544:5544 splitwise-to-toshl`

Accessing files in the container

`docker exec -it <container_id> /bin/bash`
