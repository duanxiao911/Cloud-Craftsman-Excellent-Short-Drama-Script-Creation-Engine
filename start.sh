#!/usr/bin/env bash
set -euo pipefail

# ─── 云匠引擎 · 一键启动脚本 ───
# 用法: ./start.sh [--build] [--dev]

APP_NAME="yunjiang-drama-engine"
PORT=8000
COMPOSE="docker compose"
command -v docker-compose &>/dev/null && COMPOSE="docker-compose"

# ── 前置检查 ──
check_prereqs() {
  if ! command -v docker &>/dev/null; then
    echo "❌ 未检测到 Docker，请先安装: https://docs.docker.com/get-docker/"
    exit 1
  fi
  if ! $COMPOSE version &>/dev/null 2>&1; then
    if ! docker-compose version &>/dev/null 2>&1; then
      echo "❌ 未检测到 docker-compose，请先安装"
      exit 1
    fi
  fi
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      cp .env.example .env
      echo "⚠️  已从 .env.example 复制为 .env，请填入 API Key"
    else
      echo "⚠️  未找到 .env 文件，创建最小配置..."
      cat > .env << 'ENVEOF'
# 必填：大模型 API Key
DRAMA_LLM_API_KEY=your-api-key-here
DRAMA_LLM_BASE_URL=https://api.deepseek.com/v1
DRAMA_LLM_MODEL=deepseek-chat
ENVEOF
      echo "⚠️  请编辑 .env 填入 API Key 后重新启动"
    fi
    exit 1
  fi
  if ! grep -q "API_KEY" .env || grep -q "your-api-key-here" .env 2>/dev/null; then
    echo "⚠️  请在 .env 中填入有效的 API Key"
    exit 1
  fi
}

# ── 参数处理 ──
DO_BUILD=false
DEV_MODE=false
for arg in "$@"; do
  case $arg in
    --build) DO_BUILD=true ;;
    --dev) DEV_MODE=true ;;
  esac
done

# ── 启动流程 ──
echo "🎬 云匠引擎 · 启动中..."
check_prereqs

# 创建必要目录
mkdir -p data logs

# 停止旧服务
$COMPOSE down --remove-orphans 2>/dev/null || true

if [ "$DO_BUILD" = true ]; then
  echo "🔨 重新构建镜像..."
  $COMPOSE build --no-cache
fi

if [ "$DEV_MODE" = true ]; then
  echo "🛠  开发模式启动..."
  $COMPOSE up --build
else
  echo "🚀 生产模式启动..."
  $COMPOSE up -d --build
fi

# ── 等待就绪 ──
echo "⏳ 等待服务就绪..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:${PORT}/health" &>/dev/null; then
    echo ""
    echo "════════════════════════════════════════"
    echo "✅ 云匠引擎启动成功！"
    echo ""
    echo "  🌐 前端界面:  http://localhost:${PORT}/demo/"
    echo "  📡 API 文档:  http://localhost:${PORT}/docs"
    echo "  💊 健康检查:  http://localhost:${PORT}/health"
    echo "════════════════════════════════════════"
    exit 0
  fi
  printf "."
  sleep 1
done

echo ""
echo "⚠️  服务启动超时，请检查日志: $COMPOSE logs"
