# Store secrets in Parameter Store (free tier - standard parameters)
resource "aws_ssm_parameter" "clipdrop_api_key" {
  name  = "/${var.app_name}/clipdrop-api-key"
  type  = "SecureString"
  value = var.clipdrop_api_key
}

resource "aws_ssm_parameter" "cloudinary_cloud_name" {
  name  = "/${var.app_name}/cloudinary-cloud-name"
  type  = "SecureString"
  value = var.cloudinary_cloud_name
}

resource "aws_ssm_parameter" "cloudinary_api_key" {
  name  = "/${var.app_name}/cloudinary-api-key"
  type  = "SecureString"
  value = var.cloudinary_api_key
}

resource "aws_ssm_parameter" "cloudinary_api_secret" {
  name  = "/${var.app_name}/cloudinary-api-secret"
  type  = "SecureString"
  value = var.cloudinary_api_secret
}
