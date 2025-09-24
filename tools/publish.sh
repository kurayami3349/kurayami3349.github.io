#!/usr/bin/env bash
#
# Safely publish blog to GitHub
# This script will:
# 1. Run tests to ensure site content is valid
# 2. If tests pass, commit and push to GitHub
# 3. If tests fail, notify user and abort

set -eu

SITE_DIR="_site"
COMMIT_MSG="Update blog content"

# 显示帮助信息
help() {
  echo "安全地发布博客到GitHub"
  echo
  echo "用法:"
  echo "   bash $0 [options]"
  echo
  echo "选项:"
  echo '     -m, --message   "commit message"    指定提交信息'
  echo "     -h, --help                        显示帮助信息"
}

# 运行测试
run_tests() {
  echo "运行网站内容测试..."
  if ! bash tools/test.sh; then
    echo "❌ 测试失败！请修复以下问题后重试："
    echo "1. 检查所有链接是否有效"
    echo "2. 确保所有HTML标签正确闭合"
    echo "3. 验证所有引用的资源是否存在"
    echo "完成修复后，重新运行 'tools/test.sh' 确认问题已解决"
    exit 1
  fi
  echo "✅ 测试通过！"
}

# 提交并推送到GitHub
publish_to_github() {
  echo "准备发布到GitHub..."
  
  # 检查是否有变更
  if [[ -z "$(git status --porcelain)" ]]; then
    echo "没有检测到任何变更，无需发布"
    exit 0
  fi

  # 添加所有变更
  git add .

  # 提交变更
  git commit -m "$COMMIT_MSG"

  # 推送到远程仓库
  echo "推送到GitHub..."
  git push origin main

  echo "✅ 发布完成！"
}

# 主函数
main() {
  # 首先运行测试
  run_tests
  
  # 如果测试通过，发布到GitHub
  publish_to_github
}

# 处理命令行参数
while (($#)); do
  opt="$1"
  case $opt in
    -m|--message)
      COMMIT_MSG="$2"
      shift
      shift
      ;;
    -h|--help)
      help
      exit 0
      ;;
    *)
      # 未知选项
      help
      exit 1
      ;;
  esac
done

main