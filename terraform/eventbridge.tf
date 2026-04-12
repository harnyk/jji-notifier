resource "aws_scheduler_schedule" "fetch" {
  name       = "${local.project}-fetch"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0/15 8-18 * * ? *)"
  schedule_expression_timezone = "Europe/Berlin"

  target {
    arn      = aws_lambda_function.fetch.arn
    role_arn = aws_iam_role.scheduler.arn

    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}

resource "aws_scheduler_schedule" "notify" {
  name       = "${local.project}-notify"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(* 8-18 * * ? *)"
  schedule_expression_timezone = "Europe/Berlin"

  target {
    arn      = aws_lambda_function.notify.arn
    role_arn = aws_iam_role.scheduler.arn

    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}

# Extra schedule to cover 19:00–19:02 CET (beyond the main 9–18 window)
resource "aws_scheduler_schedule" "notify_tail" {
  name       = "${local.project}-notify-tail"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0-2 19 * * ? *)"
  schedule_expression_timezone = "Europe/Berlin"

  target {
    arn      = aws_lambda_function.notify.arn
    role_arn = aws_iam_role.scheduler.arn

    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}
