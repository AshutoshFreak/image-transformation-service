# Terraform Infrastructure

AWS infrastructure for deploying the Image Transformation Service.

## Architecture

![Architecture Diagram](https://drive.google.com/file/d/1s-dnPN3b94dPC8vjxvOA6m0ejoK74ZWi)

## Resources Created

| Resource | Purpose |
|----------|---------|
| ECS Cluster | Runs Fargate tasks with backend + frontend containers |
| ECR Repositories | Stores Docker images for backend and frontend |
| ALB | Routes HTTP traffic to ECS tasks |
| CloudFront | HTTPS termination and CDN caching |
| Parameter Store | Securely stores API keys |
| Security Groups | Network access control for ALB and ECS |
| IAM Roles | ECS task execution permissions |
| CloudWatch Logs | Container logs (7-day retention) |

## Cost Optimization

- **Fargate Spot**: Uses spot capacity (up to 70% cheaper than on-demand)
- **Minimal resources**: 0.25 vCPU, 512MB memory
- **Short log retention**: 7 days to minimize storage costs

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0
3. API keys for Clipdrop and Cloudinary

## Usage

### 1. Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your API credentials:

```hcl
clipdrop_api_key      = "your-clipdrop-key"
cloudinary_cloud_name = "your-cloud-name"
cloudinary_api_key    = "your-api-key"
cloudinary_api_secret = "your-api-secret"
```

### 2. Deploy Infrastructure

```bash
terraform init
terraform plan    # Review changes
terraform apply   # Deploy
```

### 3. Push Docker Images

After deployment, Terraform outputs commands to push images:

```bash
terraform output docker_push_commands
```

Run the output commands to build and push both images.

### 4. Access the Application

```bash
terraform output app_url
```

## Files

| File | Description |
|------|-------------|
| `main.tf` | Provider config, default VPC/subnet lookup |
| `ecs.tf` | ECS cluster, task definition, service |
| `alb.tf` | Load balancer, target group, listener |
| `ecr.tf` | Container registries |
| `cloudfront.tf` | CDN distribution |
| `iam.tf` | Execution role for secrets access |
| `secrets.tf` | Parameter Store entries |
| `security.tf` | Security groups |
| `variables.tf` | Input variable definitions |
| `outputs.tf` | Deployment outputs |

## Updating the Application

After pushing new Docker images:

```bash
aws ecs update-service \
  --cluster image-transformation-cluster \
  --service image-transformation \
  --force-new-deployment
```

## Cleanup

```bash
terraform destroy
```

**Note**: ECR repositories are set to `force_delete = true` for easy cleanup. Remove this in production if you want to preserve images.
