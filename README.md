# Image Transformation Service

A full-stack application for uploading images, removing backgrounds, applying horizontal flip transformations, and managing the resulting images.

**Live Demo:** https://d5smvf35ewesl.cloudfront.net

## Overview

Users can upload images through a drag-and-drop interface. The backend removes the background using the Clipdrop API, flips the image horizontally with Sharp, and uploads the result to Cloudinary. Each processed image gets a unique URL that users can copy or download. Images can also be deleted, which invalidates the CDN cache so they're immediately inaccessible. The API is rate-limited at 20 requests per minute.

The frontend is built with React 19 and TypeScript, bundled with Vite. The backend runs on Node.js 20 with Express, also in TypeScript. Everything is containerized with Docker using multi-stage builds for smaller production images.

For production, the app runs on AWS ECS Fargate behind an Application Load Balancer, with CloudFront providing HTTPS and CDN caching. Secrets are stored in Parameter Store, and the entire infrastructure is defined in Terraform. CI/CD is handled by GitHub Actions, which runs tests and auto-deploys on push to main.

## CI/CD

The GitHub Actions workflow in `.github/workflows/deploy.yml` handles continuous integration and deployment. On every push or PR to main, it runs the test suite. When code is merged to main, it builds Docker images, pushes them to ECR, and triggers an ECS deployment. The whole pipeline takes about 3-4 minutes from push to live.

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD pipeline
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic (Cloudinary, Clipdrop, image processing)
│   │   ├── middleware/      # Upload handling, validation
│   │   ├── types/           # TypeScript interfaces
│   │   └── index.ts         # Express app setup
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # React components
│   │   └── App.tsx          # Main application
│   ├── nginx.conf           # Production nginx config
│   ├── Dockerfile
│   └── package.json
├── terraform/               # Infrastructure as Code
│   ├── main.tf              # Provider config
│   ├── ecs.tf               # ECS cluster, task, service
│   ├── alb.tf               # Load balancer
│   ├── cloudfront.tf        # CDN and HTTPS
│   ├── ecr.tf               # Container registries
│   ├── secrets.tf           # Parameter Store
│   └── ...
└── docker-compose.yml       # Local development
```

## Local Development

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for running without Docker)

### Setup

1. **Clone and configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:3000

### Running without Docker

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/images` | Upload and process image |
| DELETE | `/api/images/:id` | Delete image from cloud |

### POST /api/images

**Request**: `multipart/form-data` with `image` field

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "image-transformation/processed_1234567890_filename",
    "url": "https://res.cloudinary.com/...",
    "originalName": "photo.jpg"
  }
}
```

## Deployment (AWS)

See [terraform/README.md](terraform/README.md) for full infrastructure documentation.

### Initial Infrastructure Setup

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your secrets

terraform init
terraform apply
```

### CI/CD (GitHub Actions)

The project includes a GitHub Actions workflow that automatically:
- Runs tests on every push/PR
- Builds and pushes Docker images to ECR on push to `main`
- Deploys to ECS

**Setup**: Add these secrets to your GitHub repository (Settings → Secrets → Actions):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Once configured, pushing to `main` triggers automatic deployment.

### Manual Deployment

If you prefer manual deployment:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-url>

# Build and push
docker build -t <backend-ecr-url>:latest ./backend
docker push <backend-ecr-url>:latest

docker build -t <frontend-ecr-url>:latest ./frontend
docker push <frontend-ecr-url>:latest

# Deploy to ECS
aws ecs update-service --cluster image-transformation-cluster --service image-transformation --force-new-deployment
```

### Destroy Infrastructure

```bash
cd terraform
terraform destroy
```

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `CLIPDROP_API_KEY` | Clipdrop API key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (build-time) |

## Testing

```bash
# Backend tests
cd backend
npm test

# With coverage
npm run test:coverage
```

## License

MIT
