# AI SQL Reports POC

A natural language to SQL reporting proof-of-concept that lets you ask questions about your sales data in plain English and receive formatted table responses.

## Features

- **Natural Language Queries**: Ask questions like "What are the top 10 customers by total orders?"
- **AI-Powered SQL Generation**: Uses OpenAI to generate SQL from natural language
- **RAG (Retrieval Augmented Generation)**: Vector search on database schema for context-aware queries
- **Security First**: SQL validation ensures only safe SELECT queries with TOP limits
- **Real-time Results**: See the generated SQL and results instantly

## Architecture

```
React (Frontend)
    ↓
NestJS (Backend)
    ↓
SQL Server (Docker) ← OpenAI (Embeddings + SQL Gen)
```

## Quick Start (First Time Setup)

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- OpenAI API key

### Step 1: Clone and Start the Database

```bash
# Clone the repository (if you haven't already)
git clone <repo-url>
cd ai-sql-reports

# Start SQL Server with sample data
docker-compose up -d

# Wait for SQL Server to be healthy (this may take 30-60 seconds)
docker-compose ps
```

This starts SQL Server with sample sales data (100 customers, 50 products, 1000 orders).

### Step 2: Configure and Start the Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-...

# Install dependencies
npm install

# Start the development server
npm run start:dev
```

The backend will start on http://localhost:3000.

### Step 3: Start the Frontend

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on http://localhost:5173.

### Step 4: Run First-Time Setup

Once all services are running, you need to index the database schema:

1. Open http://localhost:5173 in your browser
2. Click **"Run Setup"** to index your database schema
3. Wait for the setup to complete (this creates vector embeddings of your schema)
4. Start asking questions!

**Note:** The "Run Setup" step only needs to be done once. It creates embeddings of your database schema that are used for RAG (Retrieval Augmented Generation) to help the AI understand your data structure.

## Sample Questions to Try

- "What are the top 10 customers by total orders?"
- "Show me sales by product category this month"
- "Which products are running low on stock?"
- "List orders from customers in California"
- "What is the average order value?"
- "How many orders were completed last week?"
- "Show me the top 5 selling products"

## Database Schema

### Tables

- **customers** - Customer information (name, email, city, state)
- **products** - Product catalog (name, category, price, stock)
- **orders** - Customer orders (date, status, total)
- **order_items** - Individual line items per order

### Relationships

- `orders.customer_id` → `customers.id`
- `order_items.order_id` → `orders.id`
- `order_items.product_id` → `products.id`

## Security

The application enforces strict security rules using **AST-based SQL parsing** (not just regex):

- **SELECT only**: All generated queries must start with SELECT (verified via AST parsing)
- **TOP required**: Every query must include TOP to limit results
- **AST validation**: SQL is parsed into an Abstract Syntax Tree to validate structure
- **Forbidden functions**: Blocks xp_cmdshell, openrowset, and other dangerous functions
- **No dangerous keywords**: Blocks INSERT, UPDATE, DELETE, DROP, CREATE, ALTER
- **No suspicious patterns**: Prevents SQL injection attempts (comments, semicolons)
- **Query timeout**: 5-second execution limit
- **Read-only connection**: Database connection is read-only

## API Endpoints

### POST /setup
Indexes the database schema and creates vector embeddings. Run this once after starting.

### POST /ask
Ask a natural language question.

**Request:**
```json
{
  "question": "What are the top 10 customers by total orders?"
}
```

**Response:**
```json
{
  "success": true,
  "question": "What are the top 10 customers by total orders?",
  "generatedSql": "SELECT TOP 10 c.name, COUNT(o.id) as order_count FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.name ORDER BY order_count DESC",
  "columns": [{"key": "name", "label": "Customer Name"}, {"key": "order_count", "label": "Orders"}],
  "rows": [...],
  "title": "Top 10 Customers by Orders",
  "summary": "Customers ranked by number of orders placed",
  "rowCount": 10,
  "executionTimeMs": 1250
}
```

## Project Structure

```
.
├── backend/              # NestJS API
│   ├── jest.config.js    # Jest test configuration
│   └── src/
│       └── modules/
│           └── ai-report/
│               ├── ask.controller.ts
│               ├── ask.service.ts
│               ├── db.service.ts
│               ├── vector.service.ts
│               ├── sql-generator.service.ts
│               ├── sql-validator.service.ts      # Legacy regex validator
│               ├── sql-ast-validator.service.ts    # New AST-based validator
│               ├── sql-validator.service.spec.ts     # Security tests
│               └── sql-ast-validator.service.spec.ts
├── frontend/             # React SPA
│   └── src/
│       ├── components/
│       │   ├── QuestionInput.tsx
│       │   ├── ResultsTable.tsx
│       │   └── QueryLog.tsx
│       └── App.tsx
├── database/             # SQL initialization
│   └── init/
│       ├── 01-create-schema.sql
│       └── 02-seed-data.sql
└── docker-compose.yml
```

## How It Works

1. **Setup Phase** (run once):
   - Reads database schema
   - Generates embeddings for tables, columns, and business rules
   - Stores in in-memory vector store

2. **Query Phase** (per question):
   - User asks a natural language question
   - Vector search finds relevant schema context
   - OpenAI generates SQL using the context
   - **AST-based SQL Validator** parses and validates the SQL structure
   - Query executes against SQL Server (if validation passes)
   - Results are formatted with AI-generated title/summary
   - Response includes the generated SQL for transparency

## Technology Stack

- **Backend**: NestJS, TypeScript, mssql, OpenAI, node-sql-parser
- **Frontend**: React, Vite, TypeScript
- **Database**: SQL Server 2022 (Docker)
- **AI**: OpenAI GPT-4o-mini (SQL generation), text-embedding-3-small (embeddings)
- **Testing**: Jest, ts-jest

## Troubleshooting

### SQL Server won't start

Make sure you have enough memory. SQL Server requires at least 2GB RAM.

```bash
docker-compose down -v
docker-compose up -d
```

### Database connection errors

Check that the SQL Server container is healthy:

```bash
docker-compose ps
```

### OpenAI errors

Ensure your OPENAI_API_KEY is set correctly in `backend/.env`.

## Testing

The project includes comprehensive unit tests for SQL validation:

```bash
cd backend
npm test
```

This runs 66 tests covering:
- Valid SELECT queries with TOP
- Rejection of dangerous statements (INSERT, UPDATE, DELETE, DROP, etc.)
- SQL injection pattern detection
- AST-based validation logic
- Input sanitization

To run tests in watch mode during development:
```bash
npm run test:watch
```

## License

MIT
