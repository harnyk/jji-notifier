resource "aws_s3_bucket_lifecycle_configuration" "tfstate_lambda_zips" {
  bucket = local.tfstate_bucket

  rule {
    id     = "expire-lambda-zips"
    status = "Enabled"

    filter {
      prefix = "lambda-zips/"
    }

    expiration {
      days = 30
    }
  }
}
