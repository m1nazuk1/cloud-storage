# Thesis Cloud Storage — облачное хранилище для дипломного проекта

Стек: **Spring Boot 4** (Java 17) + **PostgreSQL** + **React** (Vite) + **Docker Compose**.

## Возможности

- Регистрация / вход, активация аккаунта по ссылке из письма  
- Рабочие группы, приглашение по ссылке и **поиск пользователей по имени**  
- Файлы в группах (загрузка, скачивание, удаление)  
- Чат в группе (WebSocket / STOMP)  
- Уведомления о событиях в группах  
- Профиль пользователя  

## Быстрый старт (Docker)

Из **корня репозитория** (запуск приложения **как раньше**, без изменений):

```bash
docker compose up --build
```

- Веб-интерфейс: **http://localhost** (nginx → фронт, `/api` → бэкенд)  
- API напрямую: **http://localhost:8080**  

Переменные окружения см. **`.env.example`**.

### Полный сброс базы и томов

Если после «очистки БД» снова видите старых пользователей — данные лежат в **Docker-томе**. Нужно удалить тома:

```bash
docker compose down -v
docker compose up --build
```

Единый скрипт сброса (Docker или локальный Postgres на хосте):

```bash
chmod +x scripts/reset-data.sh
./scripts/reset-data.sh              # меню: 1 = Docker, 2 = локальный psql
./scripts/reset-data.sh docker       # только тома compose (БД + uploads)
./scripts/reset-data.sh local        # только DROP/CREATE thesis_db на localhost
```

После сброса в браузере очистите данные сайта для `localhost` или откройте окно инкогнито (иначе останется старый JWT в `localStorage`).

#### «Email уже зарегистрирован» после скрипта сброса

Чаще всего backend смотрит **не в ту PostgreSQL**:

- В логах Spring при старте ищите строку **`[DB] Активный spring.datasource.url`**.  
  - Для стека **целиком в Docker** должно быть что-то вроде `jdbc:postgresql://db:5432/thesis_db`.  
  - Если видите **`localhost:5432`** — приложение подключилось к **Postgres на вашем Mac**, а не к контейнеру. Скрипт `down -v` чистит только том Docker; **локальная БД на хосте не очищается**.

Проверка, что в контейнере таблица пользователей пустая (после `up`):

```bash
docker compose exec db psql -U postgres -d thesis_db -c "SELECT COUNT(*) FROM users;"
```

Должно быть `0`. Если при этом в интерфейсе всё ещё «email занят» — вы обращаетесь к **другому** экземпляру API (например, запущен `mvn` в IDE на другой БД). Остановите лишний backend или выровняйте `spring.datasource.url`.

## Локальная разработка без Docker

1. PostgreSQL локально, база `thesis_db`, пользователь/пароль как в `thesis/src/main/resources/application.properties`.  
2. Бэкенд: `cd thesis && ./mvnw spring-boot:run`  
3. Фронт: `cd thesis-frontend && npm install && npm run dev` — прокси в `vite.config.ts` перенаправляет `/api` и `/ws` на `localhost:8080`.

## Тесты бэкенда — как запустить и посмотреть результат

Да, **достаточно одной команды** из папки `thesis`: скрипт сам делает `mvn test`, surefire отчёт и генерацию html, на mac часто сам открывает браузер. Ручная цепочка `mvn test` → `surefire-report` → `python3 ...` нужна только если хочешь шаги раздельно.

```bash
cd thesis
bash scripts/view-test-report.sh
```

Если нужно только прогнать тесты без отчёта: `mvn test`. Если отчёт вручную: после `mvn test` выполнить `mvn surefire-report:report` и `python3 scripts/generate-pretty-test-report.py`.

### Где смотреть результат

| Файл | Зачем открывать |
|------|-----------------|
| `thesis/target/reports/tests-overview.html` | Кратко по смыслу каждого теста и статус |
| `thesis/target/reports/surefire.html` | Обычный отчёт maven |

Папка `thesis/target/` появляется после тестов. Можно открыть `.html` двойным кликом или перетащить в браузер.

## Важные переменные

| Переменная | Назначение |
|------------|------------|
| `APP_FRONTEND_URL` | Базовый URL фронта для редиректов после активации почты (`http://localhost` в Docker) |
| `APP_CORS_ORIGINS` | Разрешённые origin для CORS |
| `MAIL_PASSWORD` | Пароль SMTP (Яндекс и т.д.); не задавайте пустым в compose |
| `DEV_TOOLS_ENABLED` | `true` — включаются отладочные эндпоинты `/api/dev/*` |
| `DB_PASSWORD` | Пароль PostgreSQL в compose |

## Типичные проблемы

1. **«Почта уже занята» после удаления БД** — том Postgres не удалён; выполните `docker compose down -v`.  
2. **Сразу кидает в аккаунт после сброса БД** — в браузере удалите `localStorage` (ключи `access_token`, `user`).  
3. **Приглашения / поиск пользователей падали** — исправлено порядком маршрутов Spring: статические пути вроде `/search` объявлены **выше** `/{id}`.  
4. **Письма не уходят** — проверьте `MAIL_PASSWORD`, логи бэкенда, что порт SMTP не блокируется.

## Структура каталогов

```
thesis/              — Spring Boot API
thesis-frontend/     — React SPA
docker-compose.yml   — оркестрация
scripts/             — вспомогательные скрипты
```

## API (кратко)

- `POST /api/auth/register`, `POST /api/auth/login`  
- `GET /api/user/profile` — текущий пользователь (JWT)  
- `GET /api/user/search?query=&excludeGroupId=` — поиск пользователей  
- `GET /api/group/my`, `POST /api/group`, `GET /api/group/{id}`  
- `GET /health` — проверка живости бэкенда (без авторизации)  

Полная схема: Swagger при включённом `springdoc` — `/swagger-ui.html` (в `application.properties`).

## Лицензия

Учебный проект.
