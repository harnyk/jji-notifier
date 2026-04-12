resource "aws_lambda_function" "fetch" {
  function_name = "${local.project}-fetch"
  role          = aws_iam_role.fetch.arn
  s3_bucket     = local.tfstate_bucket
  s3_key        = var.fetch_zip_key
  runtime       = "nodejs22.x"
  handler       = "fetch.handler"
  timeout       = var.lambda_timeout_fetch
  memory_size   = var.lambda_memory

  environment {
    variables = {
      MONGO_URI    = var.mongo_uri
      NODE_OPTIONS = "--enable-source-maps"
    }
  }

  logging_config {
    log_format = "JSON"
    log_group  = aws_cloudwatch_log_group.fetch.name
  }

  tags = local.common_tags

  depends_on = [aws_iam_role_policy_attachment.fetch_basic]
}

resource "aws_lambda_function" "notify" {
  function_name = "${local.project}-notify"
  role          = aws_iam_role.notify.arn
  s3_bucket     = local.tfstate_bucket
  s3_key        = var.notify_zip_key
  runtime       = "nodejs22.x"
  handler       = "notify.handler"
  timeout       = var.lambda_timeout_notify
  memory_size   = var.lambda_memory

  environment {
    variables = {
      MONGO_URI        = var.mongo_uri
      TELEGRAM_TOKEN   = var.telegram_token
      TELEGRAM_CHAT_ID = var.telegram_chat_id
      NODE_OPTIONS     = "--enable-source-maps"
    }
  }

  logging_config {
    log_format = "JSON"
    log_group  = aws_cloudwatch_log_group.notify.name
  }

  tags = local.common_tags

  depends_on = [aws_iam_role_policy_attachment.notify_basic]
}
