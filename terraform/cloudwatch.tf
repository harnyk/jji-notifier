resource "aws_cloudwatch_log_group" "fetch" {
  name              = "/aws/lambda/${local.project}-fetch"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "notify" {
  name              = "/aws/lambda/${local.project}-notify"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = local.project

  dashboard_body = jsonencode({
    widgets = [
      # Row 1: custom business metrics
      {
        type   = "metric"
        x = 0
        y = 0
        width = 8
        height = 6
        properties = {
          title  = "Offers fetched & new"
          region = var.aws_region
          view   = "timeSeries"
          stat   = "Sum"
          period = 900
          metrics = [
            ["jji", "offers_fetched", { label = "Fetched", color = "#1f77b4" }],
            ["jji", "offers_new",     { label = "New",     color = "#2ca02c" }],
          ]
        }
      },
      {
        type   = "metric"
        x = 8
        y = 0
        width = 8
        height = 6
        properties = {
          title  = "Fetch duration (ms)"
          region = var.aws_region
          view   = "timeSeries"
          stat   = "Average"
          period = 900
          metrics = [
            ["jji", "fetch_duration_ms", { label = "Avg duration" }],
          ]
        }
      },
      {
        type   = "metric"
        x = 16
        y = 0
        width = 8
        height = 6
        properties = {
          title  = "Notifications sent"
          region = var.aws_region
          view   = "timeSeries"
          stat   = "Sum"
          period = 900
          metrics = [
            ["jji", "notifications_sent", { label = "Sent", color = "#ff7f0e" }],
          ]
        }
      },
      # Row 2: Lambda health
      {
        type   = "metric"
        x = 0
        y = 6
        width = 12
        height = 6
        properties = {
          title  = "Lambda invocations & errors"
          region = var.aws_region
          view   = "timeSeries"
          stat   = "Sum"
          period = 900
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.fetch.function_name,  { label = "fetch invocations" }],
            ["AWS/Lambda", "Errors",      "FunctionName", aws_lambda_function.fetch.function_name,  { label = "fetch errors",  color = "#d62728" }],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.notify.function_name, { label = "notify invocations" }],
            ["AWS/Lambda", "Errors",      "FunctionName", aws_lambda_function.notify.function_name, { label = "notify errors", color = "#e377c2" }],
          ]
        }
      },
      {
        type   = "metric"
        x = 12
        y = 6
        width = 12
        height = 6
        properties = {
          title  = "Lambda duration (ms)"
          region = var.aws_region
          view   = "timeSeries"
          stat   = "Average"
          period = 900
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.fetch.function_name,  { label = "fetch" }],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.notify.function_name, { label = "notify" }],
          ]
        }
      },
    ]
  })
}

resource "aws_sns_topic" "alerts" {
  name = "${local.project}-alerts"
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "notify_errors" {
  alarm_name          = "${local.project}-notify-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 900
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.notify.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "fetch_errors" {
  alarm_name          = "${local.project}-fetch-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 900
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.fetch.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  tags          = local.common_tags
}
