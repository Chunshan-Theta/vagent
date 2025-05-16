#!/bin/sh

# Wait for app to be ready
echo "Waiting for app to be ready..."
sleep 10

# Create database if it doesn't exist
echo "Creating database..."
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "
  CREATE DATABASE ${POSTGRES_DB};
" || echo "Database already exists"

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run migrations
echo "Running migrations..."
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
"

# Run each migration file
for file in /app/src/db/migrations/*.sql; do
  echo "Running migration: $file"
  filename=$(basename "$file")
  migration_name="${filename%.*}"
  
  # Check if migration was already executed
  if ! PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "
    SELECT 1 FROM migrations WHERE name = '$migration_name';
  " | grep -q 1; then
    echo "Running migration: $migration_name"
    PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -f "$file"
    PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "
      INSERT INTO migrations (name) VALUES ('$migration_name');
    "
    echo "Completed migration: $migration_name"
  fi
done

echo "Database initialization completed" 