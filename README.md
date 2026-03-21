# CTSE project

This repo has **no root `package.json`**. Each part installs and runs on its own.

## Install (local dev)

Run once per folder:

```bash
cd services/account-service && npm install && cd ../..
cd services/shipment-service && npm install && cd ../..
cd services/tracking-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
cd api-gateway && npm install && cd ..
cd frontend && npm install && cd ..
```

## Run services

From repo root, use `npm --prefix <path> run <script>`:

| Part | Dev | Start (prod-style) |
|------|-----|--------------------|
| Frontend | `npm --prefix frontend run dev` | `npm --prefix frontend run build` then serve `frontend/dist` |
| API gateway | `npm --prefix api-gateway run dev` | `npm --prefix api-gateway run start` |
| Account | `npm --prefix services/account-service run dev` | `npm --prefix services/account-service run start` |
| Shipment | `npm --prefix services/shipment-service run dev` | … |
| Tracking | `npm --prefix services/tracking-service run dev` | … |
| Notification | `npm --prefix services/notification-service run dev` | … |

## Docker

```bash
docker compose up --build -d
```

- **Frontend (nginx):** http://localhost  
- **API gateway (published on host to avoid clashing with a local gateway on 3000):** http://localhost:3001  

Copy `.env.docker.example` → `.env` in the project root (or merge) so `MONGODB_URI` is set.  
`VITE_API_GATEWAY_BASE_URL` must match the gateway host port (default **`http://localhost:3001`**). After changing it, rebuild the frontend image: `docker compose build frontend --no-cache`.

If you see **ERR_CONNECTION_REFUSED**, run `docker compose ps` — containers must be **Up**, not only **Created**. Stop anything using ports **80** or **3001**, or change the left side of `ports:` mappings in `docker-compose.yml`.

## Cleanup

If you still have an old **`node_modules`** folder at the repo root, you can delete it — it is no longer used.
