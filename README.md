# TaaS Pulse

Full-stack React project for tracking deadlines, budget, team capacity, sprint progress, and delivery risk in a Team as a Service workflow.

See [SETUP.md](SETUP.md) for the initial project setup and roadmap.

## Local database

The SQLite schema lives in `server/db/schema.sql`, with demo seed data in `server/db/seed.sql`.

Recreate the local database with:

```bash
npm run db:reset
```

The generated database is `server/data/taas_pulse.db` and is intentionally ignored by Git.
