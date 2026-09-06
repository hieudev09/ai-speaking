-- Enable required PostgreSQL extensions for ai-speaking platform
-- Must run BEFORE Prisma migrations

-- UUID generation (used by all tables via gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgvector — for RAG embedding storage and similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- pg_trgm — for trigram text similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
