#!/bin/sh
# Creative ON 배포 — 수정 후 이거 한 줄이면 1~2분 뒤 사이트 반영
# 사용법: sh deploy.sh "무엇을 고쳤는지"
set -e
cd "$(dirname "$0")"
MSG="${1:-사이트 수정}"
git add -A
git commit -m "$MSG" || { echo "변경사항 없음"; exit 0; }
git push
echo ""
echo "푸시 완료. 1~2분 뒤 반영: https://kaycomm21.github.io/creative-on/"
