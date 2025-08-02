# Halow Service

A TypeScript-based web service that provides a dashboard interface for managing data stored in DynamoDB. The service is designed to be deployed on Kubernetes using ArgoCD.

## Features

- **Dashboard Interface**: Web-based dashboard to view and manage DynamoDB data
- **DynamoDB Integration**: Full CRUD operations with AWS DynamoDB
- **Health Checks**: Kubernetes-compatible health check endpoints
- **IAM Role Integration**: Uses AWS IAM roles for service accounts (IRSA)
- **Responsive Design**: Mobile-friendly dashboard interface

## Architecture

- **Language**: TypeScript/Node.js
- **Framework**: Express.js
- **Database**: AWS DynamoDB
- **Authentication**: AWS IAM roles via Kubernetes service accounts
- **Views**: EJS templates with responsive CSS

## Local Development

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- AWS credentials (for local development)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export NODE_ENV=development
export PORT=3400
export AWS_REGION=us-east-1
export DYNAMODB_TABLE_NAME=halow-data-local
```

3. Build the application:
```bash
npm run build
```

4. Start the development server:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Server port | `3400` |
| `AWS_REGION` | AWS region for DynamoDB | `us-east-1` |
| `DYNAMODB_TABLE_NAME` | DynamoDB table name | `halow-data` |

## API Endpoints

### Web Interface
- `GET /` - Dashboard homepage
- `GET /dashboard` - Main dashboard view
- `POST /data` - Add new data item
- `DELETE /data/:id` - Delete data item

### Health Checks (Kubernetes)
- `GET /probe/startup` - Startup probe
- `GET /probe/liveness` - Liveness probe  
- `GET /probe/readiness` - Readiness probe

## Docker

### Build Image
```bash
docker build -t halow:latest .
```

### Run Container
```bash
docker run -p 3400:3400 \
  -e AWS_REGION=us-east-1 \
  -e DYNAMODB_TABLE_NAME=halow-data \
  halow:latest
```

## DynamoDB Schema

The service expects a DynamoDB table with the following structure:

### Table Configuration
- **Partition Key**: `id` (String)
- **Billing Mode**: On-demand or Provisioned
- **Encryption**: Server-side encryption enabled

### Item Structure
```json
{
  "id": "uuid-string",
  "title": "Item title",
  "description": "Item description", 
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "optional": "additional data"
  }
}
```

## Deployment

This service is designed to be deployed using:
1. **Terraform** - Infrastructure provisioning (DynamoDB table, IAM roles)
2. **Kubernetes** - Container orchestration
3. **ArgoCD** - GitOps deployment

See the `tf-svc-halow/` and `halow-ops/` directories for deployment configurations.

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run in production mode
npm start

# Run tests
npm test
```

## Security

- **ReadOnly Root Filesystem**: Container runs with read-only root filesystem
- **Non-root User**: Runs as non-root user (uid: 1001)
- **IAM Roles**: Uses AWS IAM roles for DynamoDB access
- **Encrypted Storage**: DynamoDB data encrypted at rest

## Monitoring

The service provides health check endpoints compatible with Kubernetes probes:
- Startup probe ensures the application has started
- Liveness probe detects if the application is running
- Readiness probe checks if the application can serve traffic

## License

Copyright © 2024 Highspot Inc.