terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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
  tfstate_bucket = "jji-notifier-tfstate"
}
