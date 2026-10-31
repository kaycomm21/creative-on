#!/bin/sh
# 모션 효과 롤백 — index.html 에서 motion.css / motion.js 연결 2줄만 지우고 배포한다.
# (모션 이후에 한 다른 수정은 그대로 남는다)
# 사용법: sh rollback_motion.sh
set -e
cd "$(dirname "$0")"
sed -i '/motion\.css?v=/d; /motion\.js?v=/d' index.html
if grep -q "motion\." index.html; then echo "연결 줄이 남아 있음 — 중단"; exit 1; fi
sh deploy.sh "모션 효과 롤백 (motion.css/js 연결 해제)"
echo "롤백 완료. 1~2분 뒤 이전 화면으로 돌아갑니다."
