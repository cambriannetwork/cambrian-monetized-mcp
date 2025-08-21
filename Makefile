# Makefile for Cambrian MCP Server Docker & GCP Deployment

.PHONY: help build run test deploy clean

# Variables
PROJECT_ID ?= your-gcp-project-id
SERVICE_NAME = cambrian-mcp-server
REGION = us-central1
IMAGE_TAG = latest

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker image locally
	docker build -t $(SERVICE_NAME):$(IMAGE_TAG) .

run: ## Run Docker container locally
	docker-compose up

run-detached: ## Run Docker container in background
	docker-compose up -d

stop: ## Stop Docker container
	docker-compose down

test-local: ## Test local Docker container
	@echo "Testing health endpoint..."
	@curl -f http://localhost:8080/health || echo "Health check failed"

build-gcp: ## Build and push to GCP Container Registry
	docker build -t gcr.io/$(PROJECT_ID)/$(SERVICE_NAME):$(IMAGE_TAG) .
	docker push gcr.io/$(PROJECT_ID)/$(SERVICE_NAME):$(IMAGE_TAG)

deploy-gcp: ## Deploy to GCP Cloud Run
	gcloud run deploy $(SERVICE_NAME) \
		--image gcr.io/$(PROJECT_ID)/$(SERVICE_NAME):$(IMAGE_TAG) \
		--region $(REGION) \
		--platform managed \
		--allow-unauthenticated \
		--port 8080 \
		--memory 512Mi \
		--cpu 1 \
		--min-instances 0 \
		--max-instances 100 \
		--timeout 300 \
		--set-env-vars NODE_ENV=production \
		--project $(PROJECT_ID)

logs: ## View Cloud Run logs
	gcloud run services logs read $(SERVICE_NAME) \
		--region=$(REGION) \
		--tail=50 \
		--follow \
		--project=$(PROJECT_ID)

status: ## Check service status
	gcloud run services describe $(SERVICE_NAME) \
		--region=$(REGION) \
		--format="table(status.url,status.conditions.type,status.conditions.status)" \
		--project=$(PROJECT_ID)

clean: ## Clean up local Docker resources
	docker-compose down -v
	docker system prune -f

setup-gcp: ## Initial GCP setup
	@echo "Enabling required GCP APIs..."
	gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com secretmanager.googleapis.com --project=$(PROJECT_ID)
	@echo "GCP APIs enabled successfully"

create-secret: ## Create secret in GCP Secret Manager
	@read -p "Enter MONETIZEDMCP_API_KEY value: " api_key; \
	echo -n "$$api_key" | gcloud secrets create MONETIZEDMCP_API_KEY \
		--data-file=- \
		--replication-policy="automatic" \
		--project=$(PROJECT_ID)

lint: ## Run TypeScript linter
	npm run lint || echo "No lint script found"

typecheck: ## Run TypeScript type checking
	npx tsc --noEmit