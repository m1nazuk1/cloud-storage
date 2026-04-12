#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mvn -q test surefire-report:report
PRETTY=""
if command -v python3 >/dev/null 2>&1; then
  python3 scripts/generate-pretty-test-report.py
  PRETTY="$(pwd)/target/reports/tests-overview.html"
fi
SF="$(pwd)/target/reports/surefire.html"
echo ""
echo "Отчёты:"
[[ -n "$PRETTY" && -f "$PRETTY" ]] && echo "  $PRETTY"
echo "  $SF"
OPEN="${PRETTY:-}"
[[ -z "$OPEN" || ! -f "$OPEN" ]] && OPEN="$SF"
if command -v open >/dev/null 2>&1; then open "$OPEN"
elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$OPEN"
fi
