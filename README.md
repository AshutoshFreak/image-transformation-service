# Image Transformation Service

A full-stack application for uploading images, removing backgrounds, applying horizontal flip transformations, and managing the resulting images.

## Features

- **Image Upload**: Drag-and-drop or click-to-upload interface
- **Background Removal**: Integrates with Clipdrop API for AI-powered background removal
- **Horizontal Flip**: Automatically flips processed images
- **Cloud Hosting**: Processed images hosted on Cloudinary with unique URLs
- **Image Deletion**: Delete images from cloud storage with CDN cache invalidation

## Tech Stack

### Backend
- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express.js
- **Image Processing**: Sharp (for horizontal flip)
- **Cloud Storage**: Cloudinary
- **Background Removal**: Clipdrop API

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose (local) / AWS ECS Fargate (production)
- **CDN/HTTPS**: AWS CloudFront
- **Load Balancer**: AWS ALB
- **Secrets Management**: AWS Parameter Store
- **Container Registry**: AWS ECR

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic (Cloudinary, Clipdrop, image processing)
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
│   ├── main.tf
│   ├── ecs.tf
│   ├── alb.tf
│   ├── cloudfront.tf
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

See [terraform/](terraform/) directory for infrastructure code.

### Quick Deploy

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your secrets

terraform init
terraform apply
```

### Push Docker Images

After `terraform apply`, use the output commands to push images:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-url>

# Build and push
docker build -t <backend-ecr-url>:latest ./backend
docker push <backend-ecr-url>:latest

docker build -t <frontend-ecr-url>:latest ./frontend
docker push <frontend-ecr-url>:latest

# Force ECS to deploy new images
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
