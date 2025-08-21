# MCP Server Docker & GCP Deployment Guide

## Overview
This guide walks you through deploying the Cambrian Monetized MCP Server using Docker and Google Cloud Platform (GCP).

## Prerequisites

1. **Local Development**
   - Docker and Docker Compose installed
   - Node.js 20+ installed
   - Git

2. **GCP Deployment**
   - GCP account with billing enabled
   - Google Cloud SDK (`gcloud`) installed
   - Service account with necessary permissions

## Project Structure

```
cambrian-monetized-mcp-GCP/
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml        # Local development setup
├── cloudbuild.yaml          # GCP Cloud Build configuration
├── .dockerignore            # Files to exclude from Docker build
├── .gcloudignore           # Files to exclude from GCP deployment
├── .github/
│   └── workflows/
│       └── deploy-to-gcp.yml # GitHub Actions CI/CD pipeline
├── src/
│   └── index.ts            # Main application entry point
└── package.json            # Node.js dependencies
```

## Local Development with Docker

### 1. Build and Run Locally

```bash
# Build the Docker image
docker build -t cambrian-mcp-server:local .

# Run with docker-compose
docker-compose up

# Or run directly with Docker
docker run -p 8080:8080 --env-file .env cambrian-mcp-server:local
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=8080
MONETIZEDMCP_API_KEY=your_api_key_here
# Add other required environment variables
```

### 3. Test the Container

```bash
# Health check
curl http://localhost:8080/health

# Test MCP endpoints
curl http://localhost:8080/your-endpoint
```

## GCP Setup

### 1. Initial GCP Configuration

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com

# Create a service account for deployments
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deploy"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### 2. Set up Secrets in Secret Manager

```bash
# Create secret for API key
echo -n "your-api-key-value" | gcloud secrets create MONETIZEDMCP_API_KEY \
  --data-file=- \
  --replication-policy="automatic"

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding MONETIZEDMCP_API_KEY \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Manual Deployment to Cloud Run

```bash
# Build and push image
docker build -t gcr.io/$PROJECT_ID/cambrian-mcp-server:latest .
docker push gcr.io/$PROJECT_ID/cambrian-mcp-server:latest

# Deploy to Cloud Run
gcloud run deploy cambrian-mcp-server \
  --image gcr.io/$PROJECT_ID/cambrian-mcp-server:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 100 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production \
  --set-secrets "MONETIZEDMCP_API_KEY=MONETIZEDMCP_API_KEY:latest"
```

## GitHub Actions CI/CD Setup

### 1. Create Service Account Key

```bash
# Create and download service account key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# Base64 encode the key for GitHub secrets
base64 key.json

# Delete the local key file after copying
rm key.json
```

### 2. Configure GitHub Secrets

Add these secrets in your GitHub repository settings:

- `GCP_PROJECT_ID`: Your GCP project ID
- `GCP_SA_KEY`: The base64-encoded service account key

### 3. Deploy via GitHub Actions

Push to the `main` or `production` branch to trigger automatic deployment:

```bash
git add .
git commit -m "Deploy to GCP"
git push origin main
```

## Using Cloud Build (Alternative)

### 1. Connect GitHub Repository

```bash
# Connect your GitHub repository to Cloud Build
gcloud builds connect create github \
  --project=$PROJECT_ID \
  --region=us-central1
```

### 2. Create Build Trigger

```bash
gcloud builds triggers create github \
  --repo-name=cambrian-monetized-mcp-GCP \
  --repo-owner=your-github-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --project=$PROJECT_ID
```

### 3. Trigger Build Manually

```bash
gcloud builds submit --config cloudbuild.yaml
```

## Monitoring and Logs

### View Cloud Run Logs

```bash
# Stream logs
gcloud run services logs read cambrian-mcp-server \
  --region=us-central1 \
  --tail=50 \
  --follow

# View specific time range
gcloud run services logs read cambrian-mcp-server \
  --region=us-central1 \
  --since="2024-01-01T00:00:00Z"
```

### Monitor Service Health

```bash
# Get service details
gcloud run services describe cambrian-mcp-server \
  --region=us-central1

# List revisions
gcloud run revisions list \
  --service=cambrian-mcp-server \
  --region=us-central1
```

## Rollback Procedure

```bash
# List available revisions
gcloud run revisions list \
  --service=cambrian-mcp-server \
  --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic cambrian-mcp-server \
  --to-revisions=cambrian-mcp-server-00001-abc=100 \
  --region=us-central1
```

## Cost Optimization

1. **Set Maximum Instances**: Prevent unexpected scaling
   ```bash
   --max-instances=10
   ```

2. **Set Minimum Instances to 0**: Scale to zero when not in use
   ```bash
   --min-instances=0
   ```

3. **Adjust Memory and CPU**: Use minimum required resources
   ```bash
   --memory=256Mi --cpu=1
   ```

4. **Set Concurrency Limits**: Control requests per instance
   ```bash
   --concurrency=80
   ```

## Security Best Practices

1. **Never commit secrets**: Use Secret Manager or environment variables
2. **Use least privilege**: Grant minimal IAM permissions
3. **Enable audit logging**: Track all deployments and changes
4. **Use VPC connector**: For private network access if needed
5. **Enable Cloud Armor**: For DDoS protection on production

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check Cloud Build logs
   gcloud builds list --limit=5
   gcloud builds log BUILD_ID
   ```

2. **Service Not Starting**
   ```bash
   # Check service logs
   gcloud run services logs read cambrian-mcp-server --tail=100
   ```

3. **Permission Denied**
   ```bash
   # Verify service account permissions
   gcloud projects get-iam-policy $PROJECT_ID
   ```

4. **Secret Access Issues**
   ```bash
   # Check secret permissions
   gcloud secrets get-iam-policy MONETIZEDMCP_API_KEY
   ```

## Support

For issues or questions:
- Check Cloud Run documentation: https://cloud.google.com/run/docs
- Review GitHub Actions logs in the Actions tab
- Monitor GCP Console: https://console.cloud.google.com