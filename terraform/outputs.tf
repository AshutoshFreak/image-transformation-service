output "app_url" {
  description = "HTTPS URL for the application"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "alb_url" {
  description = "ALB URL (HTTP only, use CloudFront URL instead)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_backend_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR repository URL for frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

# Helper commands for pushing images
output "docker_push_commands" {
  description = "Commands to build and push Docker images"
  value       = <<-EOT

    # 1. Login to ECR
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.backend.repository_url}

    # 2. Build and push backend
    docker build -t ${aws_ecr_repository.backend.repository_url}:latest ./backend
    docker push ${aws_ecr_repository.backend.repository_url}:latest

    # 3. Build and push frontend
    docker build -t ${aws_ecr_repository.frontend.repository_url}:latest ./frontend
    docker push ${aws_ecr_repository.frontend.repository_url}:latest

    # 4. Force ECS to pull new images
    aws ecs update-service --cluster ${var.app_name}-cluster --service ${var.app_name} --force-new-deployment --region ${var.aws_region}
  EOT
}
