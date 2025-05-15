#!/bin/bash

# Build and load the Docker image into k3s
# docker build -t vagent-app:latest .
k3d image import vagent-app:latest -c k3s-default

# Apply the Kubernetes manifests
envsubst < k8s/deployment.yaml | kubectl apply -f -

# Wait for deployments to be ready
kubectl wait --for=condition=available --timeout=300s deployment/vagent-app
kubectl wait --for=condition=available --timeout=300s deployment/postgres

echo "Deployment complete! Access the application at:"
echo "App: http://localhost:30000"
echo "PgAdmin: http://localhost:30001" 