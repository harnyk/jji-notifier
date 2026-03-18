resource "null_resource" "build" {
  triggers = {
    src     = sha1(join("", [for f in sort(fileset("${path.module}/../src", "**/*.ts")) : filesha1("${path.module}/../src/${f}")]))
    builder = filesha1("${path.module}/../scripts/build.mjs")
    pkg     = filesha1("${path.module}/../package.json")
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/.."
    command     = "pnpm install --frozen-lockfile && node scripts/build.mjs"
  }
}

resource "aws_lambda_function" "fetch" {
  function_name    = "${local.project}-fetch"
  role             = aws_iam_role.fetch.arn
  filename         = local.fetch_zip_path
  source_code_hash = null_resource.build.triggers["src"]
  runtime          = "nodejs22.x"
  handler          = "fetch.handler"
  timeout          = var.lambda_timeout_fetch
  memory_size      = var.lambda_memory

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

  depends_on = [aws_iam_role_policy_attachment.fetch_basic, null_resource.build]
}

resource "aws_lambda_function" "notify" {
  function_name    = "${local.project}-notify"
  role             = aws_iam_role.notify.arn
  filename         = local.notify_zip_path
  source_code_hash = null_resource.build.triggers["src"]
  runtime          = "nodejs22.x"
  handler          = "notify.handler"
  timeout          = var.lambda_timeout_notify
  memory_size      = var.lambda_memory

  environment {
    variables = {
      MONGO_URI        = var.mongo_uri
      TELEGRAM_TOKEN   = var.telegram_token
      TELEGRAM_CHAT_ID = var.telegram_chat_id
    }
  }

  logging_config {
    log_format = "JSON"
    log_group  = aws_cloudwatch_log_group.notify.name
  }

  tags = local.common_tags

  depends_on = [aws_iam_role_policy_attachment.notify_basic, null_resource.build]
}
