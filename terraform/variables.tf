variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-west-1"
}

variable "mongo_uri" {
  description = "MongoDB Atlas connection string"
  type        = string
  sensitive   = true
}

variable "telegram_token" {
  description = "Telegram bot token"
  type        = string
  sensitive   = true
}

variable "telegram_chat_id" {
  description = "Comma-separated Telegram chat/channel IDs to notify"
  type        = string
  sensitive   = true
}

variable "lambda_timeout_fetch" {
  description = "Timeout in seconds for the fetch Lambda"
  type        = number
  default     = 60
}

variable "lambda_timeout_notify" {
  description = "Timeout in seconds for the notify Lambda"
  type        = number
  default     = 30
}

variable "lambda_memory" {
  description = "Memory in MB for Lambda functions"
  type        = number
  default     = 256
}

variable "log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
  default     = 14
}

variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
}

variable "fetch_zip_key" {
  description = "S3 key of the fetch Lambda zip inside the tfstate bucket (set by deploy script)"
  type        = string
}

variable "notify_zip_key" {
  description = "S3 key of the notify Lambda zip inside the tfstate bucket (set by deploy script)"
  type        = string
}
