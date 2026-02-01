# ECS Task Execution Role - allows ECS to pull images and read secrets
resource "aws_iam_role" "ecs_execution" {
  name = "${var.app_name}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# Attach the managed ECS execution policy
resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Policy to read secrets from Parameter Store
resource "aws_iam_role_policy" "ecs_secrets" {
  name = "${var.app_name}-secrets"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameters",
        "ssm:GetParameter"
      ]
      Resource = [
        aws_ssm_parameter.clipdrop_api_key.arn,
        aws_ssm_parameter.cloudinary_cloud_name.arn,
        aws_ssm_parameter.cloudinary_api_key.arn,
        aws_ssm_parameter.cloudinary_api_secret.arn
      ]
    }]
  })
}
