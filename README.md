
---

## Docker Swarm Deployment

DevHub can be deployed as a Docker Swarm stack using container images published to Docker Hub.

### Architecture

- **Frontend:** React + Vite served by Nginx.
- **Backend:** Node.js and Express API.
- **Container registry:** Docker Hub.
- **Orchestration:** Docker Swarm.
- **Frontend replicas:** 2.
- **Backend replicas:** 1.
- **Frontend URL:** http://localhost:8086.

### Deployment Configuration

The `docker-stack.yml` file defines the frontend and backend services, replica counts, restart policies, published port, and overlay network.

The frontend uses Nginx to forward API requests to the backend through the internal Swarm network.

### Deploy the Stack

Run these commands from the project root:

```bash
docker swarm init
docker stack deploy -c docker-stack.yml devhub-swarm
```

If Swarm is already initialized, skip `docker swarm init`.

### Verify the Deployment

Check service replica counts:

```bash
docker stack services devhub-swarm
```

Inspect service tasks:

```bash
docker stack ps devhub-swarm
```

View application logs:

```bash
docker service logs devhub-swarm_frontend
docker service logs devhub-swarm_backend
```

### Access the Application

Open http://localhost:8086 in a browser.

Verify that the frontend loads and GitHub repository data is displayed correctly.

### Remove the Stack

When the deployment is no longer needed:

```bash
docker stack rm devhub-swarm
```

This removes the Swarm stack services and its stack-managed network. It does not remove the published Docker Hub images.

### Important Note

This deployment uses two frontend replicas and one backend replica on a single Docker Desktop Swarm node. It demonstrates service orchestration and replication, but does not provide multi-node high availability.

