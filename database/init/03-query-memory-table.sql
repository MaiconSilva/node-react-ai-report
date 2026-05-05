-- ============================================================
-- Semantic Memory Table for AI Query Caching
-- ============================================================
-- Purpose: Store user questions and generated SQL queries with
--          embedding vectors for semantic similarity search.
-- Usage:   Enables query suggestion, caching, and pattern
--          recognition in the AI reporting system.
-- ============================================================

USE SalesDB;
GO

-- Drop table if exists for clean recreation
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'query_memory')
BEGIN
    DROP TABLE query_memory;
END
GO

-- ============================================================
-- Create the semantic memory table
-- ============================================================
CREATE TABLE query_memory (
    -- Primary identifier (clustered key for optimal range scans)
    id BIGINT IDENTITY(1,1) NOT NULL,

    -- Original user question as typed (preserves casing/punctuation)
    -- Used for: Display, audit trail, exact reproduction
    question_original NVARCHAR(1000) NOT NULL,

    -- Normalized version of question for exact-match lookups
    -- Used for: Fast equality checks before expensive semantic search
    -- Normalization: lowercase, trimmed, standardized whitespace
    question_normalized NVARCHAR(1000) NOT NULL,

    -- AI-generated SQL query that answered this question
    -- Used for: Cache hits, query suggestions, audit
    generated_sql NVARCHAR(MAX) NOT NULL,

    -- Embedding vector stored as JSON array
    -- Format: "[0.123, -0.456, ...]" (1536 dimensions for text-embedding-3-small)
    -- Used for: Semantic similarity search (cosine similarity calculated in app layer)
    -- Note: SQL Server 2022+ has JSON functions for future vector operations
    embedding_vector NVARCHAR(MAX) NOT NULL,

    -- Timestamp when this record was first created
    -- Used for: TTL policies, audit trail, data retention
    created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),

    -- Timestamp when this record was last retrieved/used
    -- Used for: LRU cache eviction, usage analytics
    last_used_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),

    -- How many times this query pattern has been reused
    -- Used for: Identifying popular queries, cache warming
    usage_count INT NOT NULL DEFAULT 0,

    -- Primary key constraint
    CONSTRAINT PK_query_memory PRIMARY KEY CLUSTERED (id ASC)
);
GO

-- ============================================================
-- Indexes for read optimization
-- ============================================================

-- Index 1: Exact-match lookup on normalized question
-- Use case: Fast check for identical questions before semantic search
CREATE NONCLUSTERED INDEX IX_query_memory_normalized_question
ON query_memory (question_normalized ASC);
GO

-- Index 2: Popular and recently used queries
-- Use case: "Suggested queries", "Most popular", cache warming
CREATE NONCLUSTERED INDEX IX_query_memory_popular_recent
ON query_memory (usage_count DESC, last_used_at DESC);
GO

-- Index 3: Time-based queries for cleanup/archival
-- Use case: Delete queries older than X days, archive cold data
CREATE NONCLUSTERED INDEX IX_query_memory_created_at
ON query_memory (created_at ASC);
GO

-- ============================================================
-- Add table and column comments (extended properties)
-- ============================================================

-- Table comment
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Stores user questions and AI-generated SQL queries with embedding vectors for semantic similarity search and query caching',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'query_memory';
GO

-- Column comments
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Original user question as typed by user (preserves formatting)',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'query_memory',
    @level2type = N'COLUMN', @level2name = N'question_original';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Lowercase trimmed version of question for fast exact-match lookups',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'query_memory',
    @level2type = N'COLUMN', @level2name = N'question_normalized';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'AI-generated SQL query that successfully answered the question',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'query_memory',
    @level2type = N'COLUMN', @level2name = N'generated_sql';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'JSON array storing OpenAI embedding vector (1536 dims). Used for cosine similarity search in application layer',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'query_memory',
    @level2type = N'COLUMN', @level2name = N'embedding_vector';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'UTC timestamp when record was created',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'query_memory',
    @level2type = N'COLUMN', @level2name = N'created_at';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'UTC timestamp of last cache hit/retrieval. Updated on every reuse',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'query_memory',
    @level2type = N'COLUMN', @level2name = N'last_used_at';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Number of times this query pattern has been reused. Incremented on cache hits',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'query_memory',
    @level2type = N'COLUMN', @level2name = N'usage_count';
GO

-- ============================================================
-- Sample queries for reference (commented out)
-- ============================================================

/*
-- Insert a new query memory record
INSERT INTO query_memory (question_original, question_normalized, generated_sql, embedding_vector)
VALUES (
    'What are the top 10 customers?',
    'what are the top 10 customers',
    'SELECT TOP 10 c.name, COUNT(o.id) as orders FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.name ORDER BY orders DESC',
    '[0.123, -0.456, ...]'
);

-- Find exact match by normalized question
SELECT * FROM query_memory
WHERE question_normalized = 'what are the top 10 customers';

-- Get most popular queries
SELECT TOP 10 * FROM query_memory
ORDER BY usage_count DESC, last_used_at DESC;

-- Get queries used in the last 7 days
SELECT * FROM query_memory
WHERE last_used_at >= DATEADD(day, -7, SYSUTCDATETIME());

-- Increment usage count on cache hit
UPDATE query_memory
SET usage_count = usage_count + 1,
    last_used_at = SYSUTCDATETIME()
WHERE id = @query_id;

-- Cleanup: Delete queries not used in 90 days
DELETE FROM query_memory
WHERE last_used_at < DATEADD(day, -90, SYSUTCDATETIME());
*/

PRINT 'Semantic memory table created successfully!';
GO
