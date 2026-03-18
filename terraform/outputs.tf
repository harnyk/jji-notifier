output "fetch_lambda_arn" {
  value = aws_lambda_function.fetch.arn
}

output "notify_lambda_arn" {
  value = aws_lambda_function.notify.arn
}

output "fetch_log_group" {
  value = aws_cloudwatch_log_group.fetch.name
}

output "notify_log_group" {
  value = aws_cloudwatch_log_group.notify.name
}
