#!/usr/bin/env python3
import html
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

CLASS_INFO: dict[str, tuple[str, str]] = {
    "com.example.thesis.storage.HybridStorageDecisionTest": (
        "куда писать новый файл: диск или облако",
        "одна функция смотрит настройки и решает отправлять ли загрузку в s3/minio",
    ),
    "com.example.thesis.security.JwtTokenProviderTest": (
        "jwt: выдача и проверка токена",
        "без веб-сервера: выпускаем токен из логина и проверяем что строка валидная и из неё читается имя",
    ),
    "com.example.thesis.controller.HealthControllerTest": (
        "публичный health без пароля",
        "через mockmvc дергаем урл и смотрим ответ как у настоящего запроса",
    ),
    "com.example.thesis.ThesisApplicationTests": (
        "всё приложение spring поднимается",
        "интеграционный тест без кода: если контекст не соберётся, упадёт здесь",
    ),
}

METHOD_HINTS: dict[str, str] = {
    "whenObjectEnabledBeanPresentAndNewFilesObject_returnsTrue": (
        "облако включено в конфиге и новые файлы должны идти в облако, бин облака есть\n"
        "в тесте: метод возвращает true (идём в облако)"
    ),
    "whenObjectDisabled_returnsFalse": (
        "в конфиге облако выключено, даже если в настройке написано object\n"
        "в тесте: метод возвращает false"
    ),
    "whenObjectBeanMissing_returnsFalse": (
        "облако в настройках включено, но бина minio нет (как будто не поднялось)\n"
        "в тесте: метод возвращает false, не пытаемся писать в s3"
    ),
    "whenNewFilesLocal_returnsFalse": (
        "в настройках явно только локальные новые файлы\n"
        "в тесте: метод возвращает false даже если облако и бин есть"
    ),
    "whenNewFilesObjectCaseInsensitive_stillWorksWithDecision": (
        "слово object в конфиге могут написать большими буквами\n"
        "в тесте: метод возвращает true как при обычном object"
    ),
    "generateToken_validateAndReadSubject_roundTrip": (
        "выдали jwt для пользователя testuser и проверили цепочку\n"
        "в тесте: validatetoken даёт true, из токена читается логин testuser"
    ),
    "validateToken_rejectsInvalidString": (
        "подсовываем не jwt а просто строку\n"
        "в тесте: validatetoken даёт false"
    ),
    "getPublicHealth_returnsOkJson": (
        "проверяем публичный эндпоинт что api живой\n"
        "в тесте: get /api/public/health, статус 200, json с status OK и message что api running"
    ),
    "contextLoads": (
        "ни одного assert в теле, только аннотация springboottest\n"
        "в тесте: если приложение собралось, тест зелёный; ошибка старта = красный"
    ),
}


def no_trailing_dot(s: str) -> str:
    s = s.strip()
    while s.endswith("."):
        s = s[:-1].rstrip()
    return s


def format_purpose_html(text: str) -> str:
    text = no_trailing_dot(text.strip())
    if "\n" not in text:
        return esc(text)
    brief, outcome = text.split("\n", 1)
    brief, outcome = brief.strip(), outcome.strip()
    return (
        f'<span class="brief">{esc(brief)}</span><br/>'
        f'<span class="outcome">{esc(outcome)}</span>'
    )


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def fmt_time(t: str) -> str:
    try:
        sec = float(t)
        if sec < 0.001:
            return "< 1 мс"
        if sec < 1:
            return f"{sec * 1000:.0f} мс"
        return f"{sec:.2f} с"
    except ValueError:
        return t


def attr_any(text: str, name: str) -> str | None:
    m = re.search(rf'{re.escape(name)}="([^"]*)"', text)
    return m.group(1) if m else None


def parse_suite_file(content: str) -> dict | None:
    m_open = re.search(r"<testsuite\b", content)
    if not m_open:
        return None
    head = content[: m_open.end() + 800]
    name = attr_any(head, "name")
    if not name:
        return None
    ts = {
        "name": name,
        "time": attr_any(head, "time") or "0",
        "tests": int(attr_any(head, "tests") or 0),
        "errors": int(attr_any(head, "errors") or 0),
        "failures": int(attr_any(head, "failures") or 0),
        "skipped": int(attr_any(head, "skipped") or 0),
        "cases": [],
    }
    for block in re.finditer(
        r'<testcase name="([^"]*)" classname="([^"]*)" time="([^"]*)"[^>]*>(.*?)</testcase>',
        content,
        re.DOTALL,
    ):
        tname, classname, time_, inner = block.groups()
        status = "passed"
        detail = ""
        if "<failure" in inner:
            status = "failure"
            fm = re.search(r'<failure[^>]*(?:message="([^"]*)")?[^>]*>(.*?)</failure>', inner, re.DOTALL)
            if fm:
                detail = (fm.group(1) or fm.group(2) or "").strip()
        elif "<error" in inner:
            status = "error"
            em = re.search(r'<error[^>]*(?:message="([^"]*)")?[^>]*>(.*?)</error>', inner, re.DOTALL)
            if em:
                detail = (em.group(1) or em.group(2) or "").strip()
        elif "<skipped" in inner:
            status = "skipped"
        ts["cases"].append(
            {
                "name": tname,
                "classname": classname,
                "time": time_,
                "status": status,
                "detail": detail[:2000],
                "hint": METHOD_HINTS.get(tname, ""),
            }
        )
    for m in re.finditer(r'<testcase name="([^"]*)" classname="([^"]*)" time="([^"]*)"\s*/>', content):
        tname, classname, time_ = m.groups()
        ts["cases"].append(
            {
                "name": tname,
                "classname": classname,
                "time": time_,
                "status": "passed",
                "detail": "",
                "hint": METHOD_HINTS.get(tname, ""),
            }
        )
    return ts


def parse_reports(reports_dir: Path) -> list[dict]:
    suites: list[dict] = []
    for p in sorted(reports_dir.glob("TEST-*.xml")):
        try:
            text = p.read_text(encoding="utf-8")
        except OSError:
            continue
        suite = parse_suite_file(text)
        if suite:
            suites.append(suite)
    return suites


def aggregate(suites: list[dict]) -> dict:
    tot = err = fail = skip = 0
    time_sum = 0.0
    for s in suites:
        tot += s["tests"]
        err += s["errors"]
        fail += s["failures"]
        skip += s["skipped"]
        time_sum += float(s["time"] or 0)
    bad = err + fail
    ok_calc = tot - err - fail - skip
    return {
        "total": tot,
        "ok": ok_calc,
        "bad": bad,
        "skipped": skip,
        "time": time_sum,
        "success_pct": (100.0 * ok_calc / tot) if tot else 0.0,
    }


def render(suites: list[dict], out_path: Path) -> None:
    agg = aggregate(suites)
    now = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M")

    parts: list[str] = []
    parts.append("<!DOCTYPE html>")
    parts.append('<html lang="ru"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>')
    parts.append("<title>тесты thesis</title>")
    parts.append(
        """<style>
:root { --card:#1e293b; --muted:#94a3b8; --ok:#22c55e; --bad:#ef4444; --skip:#eab308; --line:#334155; --text:#f1f5f9; }
* { box-sizing:border-box; }
body { font-family: system-ui, sans-serif; margin:0; background:linear-gradient(165deg,#0f172a 0%,#1e1b4b 45%,#0f172a 100%); color:var(--text); min-height:100vh; }
.wrap { max-width:960px; margin:0 auto; padding:28px 20px 48px; }
h1 { font-size:1.5rem; font-weight:700; margin:0 0 8px; }
.sub { color:var(--muted); font-size:0.88rem; margin:0 0 24px; }
.grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(130px,1fr)); gap:12px; margin-bottom:20px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:14px 16px; }
.card .label { font-size:0.7rem; color:var(--muted); margin-bottom:6px; }
.card .num { font-size:1.6rem; font-weight:700; }
.card.ok .num { color:var(--ok); }
.card.bad .num { color:var(--bad); }
.card.skip .num { color:var(--skip); }
.bar { height:8px; background:#334155; border-radius:999px; overflow:hidden; margin:6px 0 18px; }
.bar > i { display:block; height:100%; background:linear-gradient(90deg,#22c55e,#4ade80); border-radius:999px; }
.legend { font-size:0.85rem; color:var(--muted); line-height:1.5; background:rgba(30,41,59,.6); border:1px solid var(--line); border-radius:10px; padding:12px 14px; margin-bottom:22px; }
.suite { background:var(--card); border:1px solid var(--line); border-radius:12px; margin-bottom:12px; overflow:hidden; }
.suite-h { padding:12px 16px; border-bottom:1px solid var(--line); display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between; align-items:flex-start; }
.suite-title { font-weight:600; }
.suite-badge { font-size:0.68rem; padding:2px 8px; border-radius:6px; background:#334155; color:var(--muted); }
.suite-desc { font-size:0.82rem; color:var(--muted); margin-top:6px; line-height:1.4; width:100%; }
table { width:100%; border-collapse:collapse; font-size:0.8rem; }
th, td { padding:8px 12px; text-align:left; border-bottom:1px solid var(--line); vertical-align:top; }
th { color:var(--muted); font-size:0.68rem; }
tr:last-child td { border-bottom:none; }
.badge { display:inline-block; padding:2px 7px; border-radius:6px; font-size:0.68rem; font-weight:600; }
.badge.ok { background:rgba(34,197,94,.2); color:#86efac; }
.badge.fail { background:rgba(239,68,68,.2); color:#fca5a5; }
.badge.err { background:rgba(239,68,68,.25); color:#fecaca; }
.badge.skip { background:rgba(234,179,8,.2); color:#fde047; }
.mname { font-size:0.72rem; color:#94a3b8; font-family:ui-monospace,monospace; margin-bottom:8px; word-break:break-all; }
.purpose { font-size:0.88rem; color:#e2e8f0; line-height:1.5; max-width:42rem; }
.purpose .outcome { color:#94a3b8; font-size:0.82rem; }
pre.fail { white-space:pre-wrap; font-size:0.7rem; color:#fecaca; background:#450a0a; padding:6px; border-radius:6px; margin-top:6px; max-height:100px; overflow:auto; }
</style></head><body><div class="wrap">"""
    )

    parts.append("<h1>результаты тестов</h1>")
    parts.append(f'<p class="sub">thesis · {esc(now)}</p>')

    parts.append('<div class="grid">')
    parts.append(f'<div class="card"><div class="label">всего</div><div class="num">{agg["total"]}</div></div>')
    parts.append(f'<div class="card ok"><div class="label">ок</div><div class="num">{agg["ok"]}</div></div>')
    parts.append(f'<div class="card bad"><div class="label">не прошло</div><div class="num">{agg["bad"]}</div></div>')
    parts.append(f'<div class="card skip"><div class="label">пропуск</div><div class="num">{agg["skipped"]}</div></div>')
    parts.append(f'<div class="card"><div class="label">секунд</div><div class="num">{agg["time"]:.1f}</div></div>')
    parts.append("</div>")

    pct = agg["success_pct"]
    parts.append(f'<p style="font-size:0.85rem;color:var(--muted);margin:0 0 4px">ок: <strong style="color:var(--text)">{pct:.0f}%</strong></p>')
    parts.append(f'<div class="bar"><i style="width:{min(100,pct):.1f}%"></i></div>')

    parts.append('<div class="legend">')
    parts.append(esc(no_trailing_dot(
        "в колонке суть: сверху коротко зачем тест, ниже серым что получаем в прогоне; "
        "мелким имя метода; красный если факт не совпал с ожиданием"
    )))
    parts.append("</div>")

    for s in suites:
        title, desc = CLASS_INFO.get(
            s["name"],
            ("прочие тесты", "смотри класс в ide по имени из surefire"),
        )
        suite_ok = s["errors"] == 0 and s["failures"] == 0
        badge = "всё ок" if suite_ok else f"ошибок: {s['errors'] + s['failures']}"
        parts.append('<div class="suite">')
        parts.append('<div class="suite-h">')
        parts.append(f'<div><div class="suite-title">{esc(no_trailing_dot(title))}</div>')
        parts.append(f'<div style="font-size:0.75rem;color:var(--muted);margin-top:3px">{esc(s["name"])}</div>')
        parts.append(f'<div class="suite-desc">{esc(no_trailing_dot(desc))}</div></div>')
        parts.append(f'<span class="suite-badge">{esc(badge)} · {esc(fmt_time(s["time"]))}</span>')
        parts.append("</div>")
        parts.append("<table><thead><tr><th>статус</th><th>суть</th><th>время</th></tr></thead><tbody>")
        for c in s["cases"]:
            if c["status"] == "passed":
                st = '<span class="badge ok">ок</span>'
            elif c["status"] == "skipped":
                st = '<span class="badge skip">скип</span>'
            elif c["status"] == "failure":
                st = '<span class="badge fail">упал</span>'
            else:
                st = '<span class="badge err">ошибка</span>'
            purpose = c["hint"] or (
                "описание не завели в скрипте\n"
                "в тесте: открой файл теста в ide и смотри assert или andexpect"
            )
            detail_html = ""
            if c["detail"] and c["status"] not in ("passed", "skipped"):
                detail_html = f'<pre class="fail">{esc(c["detail"])}</pre>'
            parts.append("<tr><td>")
            parts.append(st)
            parts.append("</td><td>")
            parts.append(
                f'<div class="mname">{esc(c["name"])}()</div>'
                f'<div class="purpose">{format_purpose_html(purpose)}</div>{detail_html}'
            )
            parts.append("</td><td>")
            parts.append(esc(fmt_time(c["time"])))
            parts.append("</td></tr>")
        parts.append("</tbody></table></div>")

    parts.append("</div></body></html>")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(parts), encoding="utf-8")
    print(f"OK: {out_path}")


def main() -> None:
    thesis = Path(__file__).resolve().parent.parent
    reports = thesis / "target" / "surefire-reports"
    if not reports.is_dir():
        print(f"Нет {reports}. Сначала: mvn test", file=sys.stderr)
        sys.exit(1)
    suites = parse_reports(reports)
    if not suites:
        print("Нет TEST-*.xml", file=sys.stderr)
        sys.exit(1)
    render(suites, thesis / "target" / "reports" / "tests-overview.html")


if __name__ == "__main__":
    main()
