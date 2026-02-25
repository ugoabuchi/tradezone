# MySQL Migration Summary

This document records the recent updates made to convert the TradeZone project
from PostgreSQL to MySQL and ensure the repository, configuration, scripts, and
documentation reflect the new database backend.

## Scope of Changes

1. **Backend Code**
   - Replaced `pg` dependency with `mysql2` and updated connection pool.
   - Added `convertPlaceholders` helper to translate `$1,$2...` to `?`.
   - Updated migration runner (`backend/src/config/migrations.ts`) for MySQL
     syntax.
   - Adjusted `init-db.ts` to create tables with VARCHAR(36) UUIDs, JSON
     columns, and MySQL-specific defaults/events.

2. **SQL Migrations**
   - All five migration scripts were rewritten for MySQL compatibility:
     - `SERIAL`/`UUID` types changed to `VARCHAR(36)` with `UUID()` defaults.
     - `JSONB` → `JSON`.
     - CHECK constraints rewritten as `ENUM`s or `CHECK` where supported.
     - Triggers replaced with `ON UPDATE` clauses where needed.

3. **Development Environment**
   - Updated `docker-compose.yml` to run `mysql:8.1` instead of PostgreSQL.
   - Adjusted `.env` examples and install scripts accordingly.

4. **Installation Script**
   - `install.sh` fully rewritten to install and configure MySQL, create user
     and database, and run migrations.
   - Environment variable names changed from `POSTGRES_*` to `MYSQL_*`.
   - Added guidance for converting PostgreSQL dumps, handling backups, etc.

5. **Documentation**
   - Updated dozens of Markdown files (`README.md`, Quickstart, Deploy,
     Monitoring, Troubleshooting, etc.) with MySQL commands and examples.
   - Replaced all `psql` and `sudo -u postgres` calls with `mysql`/`mysqladmin`.
   - Added sections on converting existing PostgreSQL dumps to MySQL.

6. **Package Management**
   - Removed Postgres-related NPM packages.
   - Regenerated `package-lock.json` to reflect new dependencies (no
     `postgres-*` packages now).
   - Committed and pushed lockfile change to remote repository.

7. **Repository Cleanup**
   - Performed comprehensive grep searches to eliminate residual Postgres
     references and fix wherever found.
   - Added migration guidance and tooling instructions in docs.

## Validation Steps

- `grep -R "postgres"` returns only explanatory mentions in
  troubleshooting guides.
- `grep -R "mysql"` confirms MySQL usage across all commands and examples.
- `npm install` completed successfully and lockfile contains no Postgres
  entries.
- Git commits show the migration changes and lockfile regeneration.

## Notes for Users

- When converting existing data dumps, use the regex examples in
  `INSTALLATION_TROUBLESHOOTING.md` or dedicated converter tools like
  `pg2mysql`. A new section in that document details step-by-step instructions.
- The backend continues to accept legacy PostgreSQL-style placeholders, so
  existing SQL in models need not be rewritten.
- Make sure to update any external scripts or cron jobs that might still use
  PostgreSQL commands.

## Next Steps

1. Review production deployments to ensure MySQL is configured and running.
2. Update any CI/CD pipelines or monitoring hooks with MySQL commands.
3. If necessary, clean up the workspace by removing any leftover
   PostgreSQL service definitions or container images.
4. Test a full data migration from PostgreSQL using a sample dump to
   validate the conversion instructions.

---

*Document generated on February 26, 2026*