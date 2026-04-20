# 🚀 AI Subscription Manager (2026)

Aplikacja webowa (Node.js + Next.js/React) do zarządzania subskrypcjami i wydatkami.

---

## ✨ Funkcje

### ✅ Obecnie dostępne

- 🔐 Rejestracja / logowanie (email + hasło, bcrypt)
- 📬 Weryfikacja konta przez email
- 🔑 Autoryzacja oparta o:
  - access token (JWT w HttpOnly cookie)
  - refresh token (rotowany + hash w bazie)

- 📊 Podstawowy dashboard (subskrypcje + koszty)
- 💎 Freemium / Pro:
  - Free → max 3 aktywne subskrypcje (limit po stronie API)
- 💸 Lista subskrypcji + miesięczny koszt
- 📊 Wykresy wydatków

---

### 🚧 W trakcie / planowane

- 📧 Integracja Gmail (OAuth2) + automatyczne wykrywanie subskrypcji
- 🤖 Ekstrakcja danych z maili przez AI (OpenAI)
- 🧠 „Pomóż mi zrezygnować” (instrukcje + szkic maila)

👉 Te funkcjonalności **nie są jeszcze w pełni zaimplementowane** (work in progress)

---

## 🧪 Testowe konta

Możesz zalogować się na gotowe konta:

- 📧 `test1@gmail.com`
- 📧 `test2@gmail.com`
- 🔑 hasło: `zaq1@WSX`

---

## ⚠️ Gmail OAuth – ważne

Projekt w Google Cloud Platform **nie został jeszcze zweryfikowany**.

👉 Co to oznacza:

- tylko ręcznie dodani użytkownicy mogą korzystać z logowania przez Google
- jeśli chcesz przetestować Gmail integration → napisz do mnie, dodam Twój email do listy testowych użytkowników (OAuth consent screen)

---

## ☁️ Deployment

Aplikacja jest przygotowana do działania na **Vercel** — bez potrzeby lokalnej konfiguracji.

## <---------------------------------- https://subly-subscription-control-panel-ej.vercel.app --------------------------------->

## 🧱 Tech stack

- Next.js (App Router + API Routes)
- React
- PostgreSQL + Prisma
- Gmail API
- OpenAI API _(planowane użycie)_
- Tailwind CSS
- Recharts

---

## 🛡️ Bezpieczeństwo

- Hasła hashowane (bcrypt)
- JWT:
  - access token (krótkotrwały)
  - refresh token (rotacja + hash w DB)

- HttpOnly cookies
- Tokeny Gmail (planowane szyfrowanie AES-256-GCM)

---

## 📁 Struktura projektu

- `app/` – strony + API
- `lib/` – logika backendu (auth, Gmail, AI, DB)
- `prisma/` – schema bazy danych
- `scripts/` – zadania (np. powiadomienia)

---

## 🧠 AI

AI **nie jest jeszcze zaimplementowane**.

Planowane użycie:

- rozpoznawanie subskrypcji z maili
- ekstrakcja danych (kwoty, daty)
- generowanie pomocy przy rezygnacji

---

## 🛠️ Technologie dodatkowe

- Prisma (ORM)
- Zod (walidacja danych)
- Tailwind (UI)

---

## 🚧 Do zrobienia (roadmap)

### 🔥 Backend / infra

- caching (np. Redis)
- rate limiting (szczególnie pod AI endpointy)

---

### 🤖 AI

- integracja z OpenAI API
- pipeline do analizy maili
- optymalizacja kosztów (batching / caching odpowiedzi)

---

### ✍️ Formularze

- integracja z `react-hook-form` (lub alternatywa pod Next.js)

---

### 💳 Produkt

- Stripe / płatności (Pro plan)
- lepszy onboarding
- system powiadomień (email / push)

---

### 📊 UX / feature’y

- insighty:
  - „wydajesz X zł miesięcznie niepotrzebnie”
  - „najdroższa subskrypcja”
  - analiza trendów

---
