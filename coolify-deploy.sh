#!/usr/bin/env bgsh
# Coolify Automated Deployment Script for Cron SaaS Platform

COOLIFY_HOST="${COOLIFY_HOST:-https://coolify.kachakaran.tech}"
GIT_REPO="https://github.com/kachakaran6/cron.git"
BRANCH="main"

echo "========================================================"
echo " Coolify Oracle VPS Deployment Trigger"
echo " Target: ${COOLIFY_HOST}"
echo " Repository: ${GIT_REPO} (${BRANCH})"
echo "========================================================"

if [ -z "$COOLIFY_TOKEN" ]; then
    echo "Notice: COOLIFY_TOKEN environment variable not set."
    echo "To deploy via Coolify API, pass: export COOLIFY_TOKEN='your-token'"
    echo "Alternatively, add https://github.com/kachakaran6/cron.git in Coolify UI at ${COOLIFY_HOST}/projects"
    exit 0
fi

echo "Triggering Coolify API deployment hook..."
curl -X POST "${COOLIFY_HOST}/api/v1/deploy" \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"repository\": \"${GIT_REPO}\",
    \"branch\": \"${BRANCH}\",
    \"compose_file\": \"docker-compose.coolify.yml\"
  }"

echo ""
echo "Deployment command sent to Coolify!"
