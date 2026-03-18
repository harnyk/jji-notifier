terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  project = "jji-notifier"
  common_tags = {
    Project   = local.project
    ManagedBy = "terraform"
  }
  fetch_zip_path  = "${path.module}/../dist/lambda/fetch.zip"
  notify_zip_path = "${path.module}/../dist/lambda/notify.zip"
}
