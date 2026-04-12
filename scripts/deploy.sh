#!/usr/bin/env bash
# Build Lambda zips, upload to S3, and run terraform apply.
# Works identically on dev machine (uses ~/.aws profile) and in CI (uses OIDC credentials).
#
# Usage:
#   ./scripts/deploy.sh                        # apply
#   ./scripts/deploy.sh -target aws_lambda_function.fetch   # pass-through to terraform
#   AWS_PROFILE=my-profile ./scripts/deploy.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUCKET="jji-notifier-tfstate"
GIT_SHA="$(git -C "$REPO_ROOT" rev-parse --short HEAD)"
FETCH_KEY="lambda-zips/fetch-${GIT_SHA}.zip"
NOTIFY_KEY="lambda-zips/notify-${GIT_SHA}.zip"

echo "==> Building Lambda zips (sha: ${GIT_SHA})"
cd "$REPO_ROOT"
node scripts/build.mjs

echo "==> Uploading to s3://${BUCKET}/${FETCH_KEY}"
aws s3 cp dist/lambda/fetch.zip  "s3://${BUCKET}/${FETCH_KEY}"
aws s3 cp dist/lambda/notify.zip "s3://${BUCKET}/${NOTIFY_KEY}"

echo "==> Running terraform apply"
cd "$REPO_ROOT/terraform"
terraform init -input=false
terraform apply -auto-approve \
  -var "fetch_zip_key=${FETCH_KEY}" \
  -var "notify_zip_key=${NOTIFY_KEY}" \
  "$@"

echo "==> Done. Deployed fetch=${FETCH_KEY} notify=${NOTIFY_KEY}"
