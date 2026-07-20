#!/bin/bash
# deploy-to-github.sh - 一键把项目推到 GitHub, 启用 GitHub Actions 自动更新
# 
# 用法:
#   1. 在 https://github.com/settings/tokens 创建一个 token (要 repo 权限)
#   2. export GH_TOKEN=ghp_xxxxxxxxxxxx
#   3. ./deploy-to-github.sh
# 
# 脚本会:
#   - 用 GH_TOKEN 创建仓库 (私有)
#   - 推送 main 分支
#   - 显示 GitHub Actions URL, 让你手动 trigger 第一次跑

set -e

if [ -z "$GH_TOKEN" ]; then
    echo "ERROR: 需要设置 GH_TOKEN 环境变量"
    echo ""
    echo "步骤 1: 在 https://github.com/settings/tokens 生成 token (勾选 'repo' 权限)"
    echo "步骤 2: export GH_TOKEN=ghp_xxxxxxxxxxxx"
    echo "步骤 3: ./deploy-to-github.sh"
    exit 1
fi

# 默认仓库名(可改)
REPO_NAME="${REPO_NAME:-leadbot}"
REPO_DESC="机器人招标商机查询 - 自动抓取 CCGP/中招国际/中国机器人网/中国公共采购网/必联网/中招联合 6 个源"

# 1. 创建仓库
echo "[1/4] 创建 GitHub 仓库: $REPO_NAME ..."
curl -s -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\": \"$REPO_NAME\", \"description\": \"$REPO_DESC\", \"private\": false, \"auto_init\": false}" \
  -o /tmp/repo_create.json
ERROR=$(python3 -c "import json; d = json.load(open('/tmp/repo_create.json')); print(d.get('message', ''))" 2>/dev/null)
if [ -n "$ERROR" ] && [ "$ERROR" != "Unprocessable Entity" ]; then
    # 'Unprocessable Entity' 通常是 repo 已存在, 没问题
    echo "  警告: $ERROR"
fi

# 2. 配 remote + push
echo "[2/4] 配 remote + push ..."
GH_USER=$(curl -s -H "Authorization: token $GH_TOKEN" https://api.github.com/user | python3 -c "import sys,json; print(json.load(sys.stdin)['login'])")
echo "  GitHub 用户: $GH_USER"

git remote remove origin 2>/dev/null || true
git remote add origin "https://${GH_TOKEN}@github.com/${GH_USER}/${REPO_NAME}.git"
git branch -M main 2>/dev/null || git checkout -B main
git push -u origin main --force

# 3. 启用 Actions (默认是启用的, 但显示出来)
echo ""
echo "[3/4] 启用 GitHub Actions ..."
curl -s -X PUT \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${GH_USER}/${REPO_NAME}/actions/permissions/workflow" \
  -d '{"enabled": true, "allowed_actions": "all"}' > /dev/null
echo "  Actions 已启用"

# 4. 显示链接
echo ""
echo "[4/4] 完成! 接下来:"
echo "  1. 打开 https://github.com/${GH_USER}/${REPO_NAME}/actions"
echo "  2. 第一次跑: 点 'Daily fetch robot tender leads' → 'Run workflow'"
echo "  3. (可选) 启用 Pages: Settings → Pages → Source: 'GitHub Actions' → Save"
echo "  4. (可选) 网站: https://${GH_USER}.github.io/${REPO_NAME}/"
echo ""
echo "之后每天北京时间 8:00 自动跑一次,网站自动更新"
