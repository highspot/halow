# Halow BuildKite Setup

This document explains the BuildKite CI/CD pipeline setup for the Halow TypeScript service.

## 🏗️ Pipeline Overview

The BuildKite pipeline is defined in `.buildkite/pipeline.yml` and consists of four main steps:

### 1. **Build & Test** 📋
- Runs in Node.js 18 Alpine container
- Installs dependencies with `npm ci`
- Builds TypeScript code with `npm run build`
- Runs tests with `npm test`
- **Timeout**: 10 minutes

### 2. **Docker Build & Push** 🐳
- Builds production Docker image
- Tags with git commit hash
- Pushes to ECR repository: `460210468233.dkr.ecr.us-east-1.amazonaws.com/engex/halow`
- Adds container labels for traceability
- **Timeout**: 20 minutes
- **Depends on**: Build & Test step

### 3. **Security Scan** 🔒
- Placeholder for security scanning (Trivy, Snyk, etc.)
- Scans the pushed Docker image
- **Timeout**: 10 minutes
- **Depends on**: Docker Build & Push step

### 4. **Update Deployment Manifests** 🚀
- **Only runs on `main` branch**
- Provides guidance for next deployment steps
- **Timeout**: 5 minutes
- **Depends on**: Docker Build & Push and Security Scan steps

## 🏪 ECR Repository Configuration

### Repository Details
- **Registry**: `460210468233.dkr.ecr.us-east-1.amazonaws.com` (SharedArtifacts account)
- **Repository Name**: `engex/halow`
- **Image Mutability**: IMMUTABLE (images cannot be overwritten)
- **Source**: `https://github.com/highspot/halow`

### Terraform Configuration
The ECR repository is defined in:
```
terraform/aws_sharedart/us-east-1/ecr-private/service-ecr-locals.tf
```

In the `engex` section:
```hcl
halow = {
  mutable = "IMMUTABLE"
  source  = "https://github.com/highspot/halow"
}
```

## 🔑 Permissions & Authentication

### BuildKite ECR Access
BuildKite has wildcard permissions for all SharedArtifacts ECR repositories via:
- **IAM Policy**: Defined in `terraform/aws_ops/us-east-1/ops-us-east-1/buildkite/iam_buildkite_default.tf`
- **Resource ARN**: `"arn:aws:ecr:us-east-1:460210468233:repository/*"`

### ECR Plugin
The pipeline uses the ECR plugin for authentication:
```yaml
plugins:
  - ecr#v2.7.0:
      login: true
      region: "us-east-1"
      account-ids:
        - "460210468233"
```

## 🏷️ Image Tagging Strategy

### Git Commit Hash Tagging
- **Primary Tag**: Git commit hash (`git rev-parse HEAD`)
- **Format**: `460210468233.dkr.ecr.us-east-1.amazonaws.com/engex/halow:abc123...`

### Container Labels
Each image includes metadata labels:
```dockerfile
--label org.opencontainers.image.revision=${VERSION}
--label org.opencontainers.image.created="$(date --iso-8601=seconds --utc)"
--label io.hspt.build.url=${BUILDKITE_BUILD_URL}
--label org.opencontainers.image.source="https://github.com/highspot/halow"
```

## 🚀 Deployment Workflow

### 1. **Code Push**
Developer pushes code to any branch

### 2. **BuildKite Trigger**
Pipeline automatically triggers and runs all steps

### 3. **Image Build**
Docker image built and pushed to ECR with commit hash tag

### 4. **Manual Deployment Update**
Currently manual - update the image tag in halow-ops repository:
```yaml
# In halow-ops/overlays/.../kustomization.yaml
images:
  - name: 460210468233.dkr.ecr.us-east-1.amazonaws.com/engex/halow
    newTag: <commit-hash>  # Update this
```

### 5. **ArgoCD Sync**
ArgoCD detects changes and deploys to Kubernetes

## 📊 Pipeline Environment Variables

The pipeline automatically sets these variables:
- `VERSION`: Git commit hash
- `ECR_HOST`: ECR registry hostname
- `REPO_NAME`: `engex/halow`
- `IMAGE_LOCAL`: Local image tag
- `IMAGE_DEST`: Final ECR image destination
- `BUILDKITE_BUILD_URL`: Link to current build

## 🎯 Next Steps & Improvements

### Short-term
1. **Add Real Tests**: Replace placeholder test command with actual unit tests
2. **Security Scanning**: Implement Trivy or Snyk container scanning
3. **Notification**: Add Slack notifications for build failures

### Long-term
1. **Automated Deployment**: Auto-update halow-ops manifests on successful builds
2. **Multi-stage Builds**: Optimize Docker builds for faster CI/CD
3. **Branch Policies**: Different deployment targets for different branches
4. **Integration Tests**: Add end-to-end testing after deployment

## 🔧 Local Testing

### Test Pipeline Steps Locally

```bash
# 1. Build & Test
cd halow/
npm ci
npm run build
npm test

# 2. Docker Build
docker build -t engex/halow:local .

# 3. ECR Push (requires AWS credentials)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  460210468233.dkr.ecr.us-east-1.amazonaws.com

docker tag engex/halow:local \
  460210468233.dkr.ecr.us-east-1.amazonaws.com/engex/halow:local

docker push 460210468233.dkr.ecr.us-east-1.amazonaws.com/engex/halow:local
```

## 📋 Troubleshooting

### Common Issues

1. **ECR Login Failures**
   - Verify BuildKite has ECR permissions
   - Check ECR plugin version and configuration

2. **Docker Build Failures**
   - Ensure TypeScript compilation succeeds
   - Verify all dependencies are properly installed

3. **Missing Dependencies**
   - Check `package.json` and `package-lock.json` are committed
   - Ensure production dependencies are correctly specified

4. **Image Push Failures**
   - Verify ECR repository exists in SharedArtifacts account
   - Check image tag format is correct

### Debug Commands

```bash
# Check ECR repository exists
aws ecr describe-repositories --repository-names engex/halow \
  --region us-east-1 --profile sharedartifacts

# List recent images
aws ecr list-images --repository-name engex/halow \
  --region us-east-1 --profile sharedartifacts

# Get build logs
buildkite-agent artifact download "build.log" .
```

---

**📚 Related Documentation:**
- [Halow Service README](README.md)
- [ECR SharedArtifacts Configuration](../terraform/aws_sharedart/README.md)
- [BuildKite Documentation](https://buildkite.com/docs)