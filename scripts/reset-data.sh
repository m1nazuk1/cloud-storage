
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${REPO_ROOT}"

usage() {
  echo "Использование: $(basename "$0") [docker|local|help]"
  echo ""
  echo "  docker  Сброс томов Docker Compose (БД и uploads в контейнерах)"
  echo "  local   DROP/CREATE базы на хосте (psql к localhost или PGHOST)"
  echo "  (без аргументов — интерактивный выбор)"
}

reset_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Ошибка: docker не найден в PATH."
    exit 1
  fi

  echo "=== Docker: останавливаю compose и удаляю тома (-v) ==="
  docker compose down -v --remove-orphans

  echo "=== Docker: удаляю тома *thesis_pgdata / *thesis_uploads (если остались) ==="
  while IFS= read -r vol; do
    [ -n "${vol:-}" ] || continue
    docker volume rm "$vol" 2>/dev/null || true
  done < <(docker volume ls -q | grep -E 'thesis_(pgdata|uploads)$' || true)

  echo ""
  echo "Готово (Docker). Поднимите стек: docker compose up --build"
  echo "Проверка после up: docker compose exec db psql -U postgres -d thesis_db -c \"SELECT COUNT(*) FROM users;\""
  echo "Очистите в браузере данные сайта для localhost (или инкогнито), чтобы сбросить JWT."
}

reset_local() {
  if ! command -v psql >/dev/null 2>&1; then
    echo "Ошибка: psql не найден. Установите клиент PostgreSQL или используйте режим docker."
    exit 1
  fi

  PGHOST="${PGHOST:-localhost}"
  PGPORT="${PGPORT:-5432}"
  PGUSER="${PGUSER:-postgres}"
  DB_NAME="${DB_NAME:-thesis_db}"
  export PGPASSWORD="${PGPASSWORD:-1234}"

  echo "=== Локальный Postgres: ${PGUSER}@${PGHOST}:${PGPORT}, база: ${DB_NAME} ==="
  echo "Остановите Spring Boot и другие клиенты этой БД, иначе DROP может не сработать."
  read -r -p "Продолжить? [y/N] " ans
  if [[ ! "${ans}" =~ ^[yY]$ ]]; then
    echo "Отмена."
    exit 0
  fi

  psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d postgres -v ON_ERROR_STOP=1 <<EOF
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS "${DB_NAME}";
CREATE DATABASE "${DB_NAME}" OWNER "${PGUSER}" ENCODING 'UTF8';
EOF

  echo ""
  echo "Готово (local): база «${DB_NAME}» пустая. Запустите приложение — Hibernate создаст таблицы (ddl-auto=update)."
}

case "${1:-}" in
  -h|--help|help)
    usage
    exit 0
    ;;
  docker)
    reset_docker
    ;;
  local)
    reset_local
    ;;
  "")
    echo "Сброс данных thesis — выберите режим:"
    echo "  1) Docker  — compose down -v, тома БД и uploads (для docker compose up)"
    echo "  2) Локальный Postgres — пересоздать thesis_db на этом компьютере (psql)"
    read -r -p "Ваш выбор [1]: " choice
    choice="${choice:-1}"
    case "${choice}" in
      1|docker|Docker) reset_docker ;;
      2|local|Local)   reset_local ;;
      *)
        echo "Неизвестный выбор."
        exit 1
        ;;
    esac
    ;;
  *)
    echo "Неизвестный аргумент: $1"
    usage
    exit 1
    ;;
esac
