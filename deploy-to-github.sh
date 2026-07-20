#!/bin/bash
# deploy-to-github.sh - 推送 leadbot 到 GitHub
#
# 两种用法:
#   A) token 权限够(repo 权限):
#      export GH_TOKEN=ghp_xxx
#      ./deploy-to-github.sh
#      -> 自动创建仓库 + push
#
#   B) 没 token / 权限不够:
#      在 https://github.com/new 手动建一个空仓库(不要勾任何选项)
#      ./deploy-to-github.sh --manual jimmyzhaoyp1989-ctrl/leadbot
#      -> 跳过创建,直接 push

set -e

REPO_NAME="leadbot"
MANUAL_REPO=""

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --manual)
            MANUAL_REPO="$2"
            shift 2
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

cd "$(dirname "$0")"

if [ -n "$MANUAL_REPO" ]; then
    # ===== 模式 B: 手动建好仓,直接 push =====
    echo "[1/2] 配 remote (manual mode: $MANUAL_REPO) ..."
    
    # 解析 user/repo
    GH_USER=$(echo "$MANUAL_REPO" | cut -d/ -f1)
    REPO_NAME=$(echo "$MANUAL_REPO" | cut -d/ -f2)
    
    if [ -n "$GH_TOKEN" ]; then
        REMOTE_URL="https://${GH_TOKEN}@github.com/${MANUAL_REPO}.git"
    else
        REMOTE_URL="https://github.com/${MANUAL_REPO}.git"
    fi
    
    git remote remove origin 2>/dev/null || true
    git remote add origin "$REMOTE_URL"
    git branch -M main 2>/dev/null || git checkout -B main
    
    echo "[2/2] push ..."
    git push -u origin main
    
    echo ""
    echo "✓ 完成! 打开 https://github.com/${MANUAL_REPO}/actions"
    exit 0
fi

# ===== 模式 A: token 自动建仓 =====
if [ -z "$GH_TOKEN" ]; then
    echo "ERROR: 需要 GH_TOKEN, 或用 --manual <user/repo> 走手动建仓模式"
    echo ""
    echo "用法 1 (自动):"
    echo "  export GH_TOKEN=ghp_xxx"
    echo "  ./deploy-to-github.sh"
    echo ""
    echo "用法 2 (手动):"
    echo "  1) 在 https://github.com/new 创建一个空仓库(不要勾任何选项)"
    echo "  2) ./deploy-to-github.sh --manual 你的用户名/leadbot"
    exit 1
fi

# 测试 token
echo "[0/4] 验证 token ..."
GH_USER=$(curl -sf -H "Authorization: token $GH_TOKEN" https://api.github.com/user | python3 -c "import sys,json; print(json.load(sys.stdin)['login'])" 2>/dev/null || echo "FAILED")
if [ "$GH_USER" = "FAILED" ]; then
    echo "  ERROR: token 无效或权限不够"
    echo "  提示: 用 https://github.com/new 手动建仓, 然后:"
    echo "    ./deploy-to-github.sh --manual $GH_USER/leadbot"
    echo "  (此时把 GH_TOKEN 当密码用就行)"
    exit 1
fi
echo "  ✓ 用户: $GH_USER"

# 创建仓库
echo "[1/4] 创建仓库: $GH_USER/$REPO_NAME ..."
CREATE_RESP=$(curl -s -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\": \"$REPO_NAME\", \"description\": \"机器人招标商机查询 - 自动抓取 CCGP/中招国际/中国机器人网/中国公共采购网/必联网/中招联合 6 个源\", \"private\": false}")
CREATE_MSG=$(echo "$CREATE_RESP" | python3 -c "import sys,json; d = json.load(sys.stdin); print(d.get('full_name', d.get('message', 'unknown')))" 2>/dev/null || echo "parse_error")

if [ "$CREATE_MSG" = "$GH_USER/$REPO_NAME" ]; then
    echo "  ✓ 创建成功"
elif echo "$CREATE_MSG" | grep -q "already exists"; then
    echo "  (仓库已存在, 继续)"
else
    echo "  WARNING: $CREATE_MSG"
    echo "  (可能权限不够, 试试手动建仓)"
    echo ""
    echo "  1) 在 https://github.com/new 创建一个空仓库: $REPO_NAME"
    echo "  2) 然后: ./deploy-to-github.sh --manual $GH_USER/$REPO_NAME"
    exit 1
fi

# Push
echo "[2/4] 配 remote + push ..."
REMOTE_URL="https://${GH_TOKEN}@github.com/${GH_USER}/${REPO_NAME}.git"
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"
git branch -M main 2>/dev/null || git checkout -B main
git push -u origin main

# 启用 Actions
echo "[3/4] 启用 GitHub Actions ..."
curl -s -X PUT \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${GH_USER}/${REPO_NAME}/actions/permissions/workflow" \
  -d '{"enabled": true, "allowed_actions": "all"}' > /dev/null
echo "  ✓ Actions 已启用"

# 总结
echo ""
echo "[4/4] ✓ 全部完成! 接下来:"
echo "  1. 打开 https://github.com/${GH_USER}/${REPO_NAME}/actions"
echo "  2. 第一次跑: 点 'Daily fetch robot tender leads' → 'Run workflow'"
echo "  3. (可选) 启用 Pages: Settings → Pages → Source: 'GitHub Actions'"
echo ""
echo "之后每天北京时间 8:00 自动跑一次,网站自动更新"
