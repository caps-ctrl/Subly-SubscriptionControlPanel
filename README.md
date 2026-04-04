# AI Subscription Manager (2026)

Aplikacja webowa (Node.js + Next.js/React) do zarządzania subskrypcjami i wydatkami:
- Rejestracja / logowanie (email + hasło, bcrypt) + sesja w cookie (JWT).
- Integracja Gmail przez OAuth2 i skan maili w poszukiwaniu subskrypcji.
- Ekstrakcja danych z maili przez LLM (OpenAI) + lista subskrypcji, miesięczny koszt, wykresy.
- Funkcja „Pomóż mi zrezygnować” (instrukcja krok po kroku + opcjonalny szkic maila w Gmail).
- Freemium/Pro: Free pozwala śledzić do 3 aktywnych subskrypcji (wymuszane po stronie API).

## Tech stack
- Next.js App Router (API Routes w `app/api/*`)
- PostgreSQL + Prisma
- Gmail API (`googleapis`)
- OpenAI (`openai`)
- Tailwind CSS + Recharts

## Szybki start (lokalnie)
1) Skopiuj zmienne środowiskowe:
   - `cp .env.example .env.local`
2) Ustaw sekrety w `.env.local`:
   - `JWT_SECRET` (min. 32 znaki)
   - opcjonalnie: `REFRESH_COOKIE_NAME`, `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`
   - `ENCRYPTION_KEY` (32 bajty base64, np. `openssl rand -base64 32`)
3) Odpal bazę:
   - `docker compose up -d`
4) Zainstaluj zależności:
   - `npm install`
5) Uruchom migracje:
   - `npm run prisma:migrate`
6) Start dev:
   - `npm run dev`

## Konfiguracja Gmail OAuth (Google Cloud)
1) Utwórz projekt w Google Cloud Console.
2) Skonfiguruj OAuth consent screen.
3) Utwórz OAuth Client (Web application) i dodaj redirect URI:
   - `http://localhost:3000/api/gmail/callback`
4) Uzupełnij w `.env.local`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (opcjonalnie, domyślnie z `APP_BASE_URL`)
5) W aplikacji wejdź w `/dashboard` i kliknij „Podłącz Gmail”.

## Konfiguracja OpenAI
W `.env.local` ustaw:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (domyślnie: `gpt-4.1-mini`)

## Powiadomienia o nadchodzących płatnościach (email)
1) Ustaw Resend w `.env.local`:
   - `RESEND_API_KEY`, `RESEND_FROM`
2) Uruchom skrypt (domyślnie: okno 3 dni):
   - `npm run notify:upcoming`
   - `NOTIFY_DAYS=7 npm run notify:upcoming`

## Bezpieczeństwo
- Hasła: `bcrypt` (hash w PostgreSQL).
- Tokeny Gmail: szyfrowane AES-256-GCM (`ENCRYPTION_KEY`) w PostgreSQL.
- Sesja: krótkotrwały `access token` JWT w HttpOnly cookie (`SESSION_COOKIE_NAME`) + rotowany `refresh token` w osobnym HttpOnly cookie, z hashem refresh tokena trzymanym w PostgreSQL.

## Struktura projektu (najważniejsze)
- `app/` – strony + API route handlers
- `lib/` – logika serwera (auth, Gmail, OpenAI, szyfrowanie, DB)
- `prisma/` – schema Prisma
- `scripts/` – zadania uruchamiane ręcznie/cron (np. powiadomienia)
