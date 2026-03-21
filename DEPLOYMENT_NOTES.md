# Deployment Notes (Jenkins + EC2)

## Required environment variables

Use a server-side root `.env` file on EC2 (do not commit real secrets):

- `MONGODB_URI`
- `VITE_API_GATEWAY_BASE_URL` (for frontend build)

Optional service URL vars for non-Docker local runs:

- `ACCOUNT_SERVICE_URL`
- `SHIPMENT_SERVICE_URL`
- `TRACKING_SERVICE_URL`
- `NOTIFICATION_SERVICE_URL`

## Local development vs EC2

- **Local Docker/EC2 deploy:** use `docker compose up -d --build` from repo root.
- **Frontend host URL:** `http://<server-ip>` (port 80 mapped in compose).
- **API gateway host URL:** `http://<server-ip>:3001`.
- **Jenkins host URL:** `http://<server-ip>:8080` (separate service on EC2 host).

## Security

- Keep `.env` untracked.
- Commit only `.env.example` / `.env.docker.example`.
- Never commit private keys or production secrets.
