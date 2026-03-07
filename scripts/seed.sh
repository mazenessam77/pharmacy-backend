#!/bin/bash
# Seeds the database with initial data (medicine catalog + admin user)
# Usage: ./scripts/seed.sh

echo "Seeding database..."
docker compose exec backend npx ts-node src/seed/medicines.seed.ts
docker compose exec backend npx ts-node src/seed/admin.seed.ts
echo "Seeding complete!"
