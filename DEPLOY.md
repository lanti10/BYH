# Deploy di BYH con Docker / Coolify

L'app gira come immagine Docker autocontenuta (Next.js `standalone`). Il `Dockerfile`
nella root fa tutto: installa, builda e avvia su `server.js` (porta **3000**).

## Variabili d'ambiente

Ci sono **due categorie**. La distinzione è importante in Coolify.

### 🔨 Build-time (le `NEXT_PUBLIC_*`)
Vengono "cotte" nel bundle del browser durante il build → in Coolify vanno marcate come
**Build Variable** (o "Available at build time"). Se le imposti solo a runtime, il sito
si carica ma Clerk/URL pubblici non funzionano.

| Variabile | Esempio | Cosa fa |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Chiave pubblica Clerk (auth lato client). |
| `NEXT_PUBLIC_APP_URL` | `https://app.tuodominio.com` | URL pubblico dell'app. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Rotta login. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Rotta registrazione. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/` | Dove va dopo il login. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/onboarding` | Dove va dopo la registrazione. |

### 🚀 Runtime (segrete)
Servono solo quando l'app gira. NON metterle come build variable.

| Variabile | Cosa fa |
|---|---|
| `DATABASE_URL` | Postgres a cui si connette l'app (es. Supabase pooler, con `sslmode=require`). |
| `DIRECT_URL` | Connessione diretta al DB (solo per migrazioni Prisma da CLI). |
| `CLERK_SECRET_KEY` | Chiave segreta Clerk (server). |
| `ANTHROPIC_API_KEY` | AI in-app (generazione/import schede). Facoltativa. |
| `AGENT_API_KEY` | Chiave per l'API dell'agente esterno (`/api/agent/*`). Facoltativa. |

## Passi in Coolify

1. **New Resource → Application → Public/Private Repository** → repo `lanti10/BYH`, branch `main`.
2. **Build Pack: `Dockerfile`** (Coolify rileva il `Dockerfile` in root).
3. **Environment Variables**: incolla tutte quelle sopra.
   - Per ogni `NEXT_PUBLIC_*` attiva l'opzione **Build Variable** (build-time).
4. **Ports**: esposta **3000** (`server.js` ascolta su `PORT`/`HOSTNAME=0.0.0.0`).
5. **Domain**: imposta il dominio; deve combaciare con `NEXT_PUBLIC_APP_URL`.
6. **Deploy**.

### Database
- Puoi puntare `DATABASE_URL` allo **stesso Supabase** già in uso (schema già migrato) —
  è la via più semplice.
- Se crei un **Postgres nuovo** in Coolify, prima applica lo schema una volta:
  `DIRECT_URL=... npx prisma db push` (o `prisma migrate deploy`) dal tuo PC contro quel DB.
  Il container **non** esegue migrazioni da solo.

### Clerk & Webhook
Dopo il primo deploy, in Clerk aggiorna i domini consentiti e (se usi il webhook)
l'endpoint `https://<dominio>/api/webhooks/clerk`.

## Build locale (test facoltativo)
```bash
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx \
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  -t byh .

docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgres://..." \
  -e CLERK_SECRET_KEY="sk_test_xxx" \
  byh
```
Apri http://localhost:3000
