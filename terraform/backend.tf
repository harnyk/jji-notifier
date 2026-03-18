terraform {
  backend "s3" {
    bucket  = "jji-notifier-tfstate"
    key     = "jji-notifier/terraform.tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}
