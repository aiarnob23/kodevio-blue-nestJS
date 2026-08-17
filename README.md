# KODEVIO SERVER NESTJS

---
## Running the Server


# Environment Variables

Backend requires the following environment variables.

```env
PORT=
NODE_ENV=

POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
DATABASE_URL=
REDIS_HOST=
REDIS_PORT=

JWT_SECRET=
JWT_ACCESS_TOKEN_EXPIRES_IN=
JWT_REFRESH_TOKEN_EXPIRES_IN=
JWT_EXPIRES_IN=
JWT_ISSUER=

LOG_LEVEL=
LOG_TO_FILE=
LOG_FILE_PATH=
```
---


## RUN

1. Navigate to the backend directory.

```bash
cd kodevio-server-nestjs
```

2. Install the project dependencies.

```bash
npm install
```

3. Start the application.

```bash
docker compose --profile dev up
```

4. Apply the database migrations.

```bash
npm run db:migrate
```

5. The backend API will be available at:

```text
http://localhost:3000
```

