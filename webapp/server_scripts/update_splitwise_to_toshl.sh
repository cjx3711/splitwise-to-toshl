#!/bin/bash

# Set variables
CONTAINER_NAME="splitwise-to-toshl"
IMAGE_NAME="splitwise-to-toshl"
BACKUP_DIR="database_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Container exists."
    
    # Stop and remove the container
    echo "Stopping and removing container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
else
    echo "Container does not exist."
fi

# Load the new docker image
echo "Loading new docker image..."
docker load -i ${IMAGE_NAME}.tar

# Run the new container
echo "Starting new container..."
docker run --name $CONTAINER_NAME -d -p 5544:5544 $IMAGE_NAME

echo "Process completed."
