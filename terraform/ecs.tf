# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
}

# Enable Fargate Spot capacity provider
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 100
  }
}

# Task definition with both frontend and backend containers
resource "aws_ecs_task_definition" "main" {
  family                   = var.app_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"  # 0.25 vCPU - minimum
  memory                   = "512"  # 0.5 GB - minimum
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:latest"
      essential = true

      portMappings = [{
        containerPort = 3000
        protocol      = "tcp"
      }]

      environment = [
        { name = "PORT", value = "3000" },
        { name = "FRONTEND_URL", value = "https://${aws_cloudfront_distribution.main.domain_name}" }
      ]

      secrets = [
        { name = "CLIPDROP_API_KEY", valueFrom = aws_ssm_parameter.clipdrop_api_key.arn },
        { name = "CLOUDINARY_CLOUD_NAME", valueFrom = aws_ssm_parameter.cloudinary_cloud_name.arn },
        { name = "CLOUDINARY_API_KEY", valueFrom = aws_ssm_parameter.cloudinary_api_key.arn },
        { name = "CLOUDINARY_API_SECRET", valueFrom = aws_ssm_parameter.cloudinary_api_secret.arn }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "wget -q --spider http://localhost:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.app_name}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
          "awslogs-create-group"  = "true"
        }
      }
    },
    {
      name      = "frontend"
      image     = "${aws_ecr_repository.frontend.repository_url}:latest"
      essential = true

      portMappings = [{
        containerPort = 80
        protocol      = "tcp"
      }]

      dependsOn = [{
        containerName = "backend"
        condition     = "HEALTHY"
      }]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.app_name}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
          "awslogs-create-group"  = "true"
        }
      }
    }
  ])
}

# ECS Service - runs exactly 1 task
resource "aws_ecs_service" "main" {
  name            = var.app_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 100
  }

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "frontend"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.http]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "main" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = 7  # Keep logs for 7 days only to minimize costs
}
