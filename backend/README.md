# Usage Insights - Backend

This backend powers the Usage Insights feature, handling event ingestion, usage aggregations, and threshold alerts. It is built using Node.js, Express, and PostgreSQL.

## Prerequisites
- Node.js (v18+)
- PostgreSQL (e.g., via Homebrew `brew install postgresql@14`)

## Setup & Running Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Setup the Database:**
   Ensure PostgreSQL is running (e.g., `brew services start postgresql@14`).
   Create the database:
   ```bash
   createdb usage_insights
   ```
   Run the migration to create tables and seed the initial data:
   ```bash
   psql -d usage_insights -f migrations/001_init.sql
   ```

3. **Environment Settings:**
   Ensure there is a `.env` file in the `backend/` directory (you can copy `.env.example`).
   ```env
   PORT=4000
   DATABASE_URL=postgresql://localhost:5432/usage_insights
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The API will run on `http://localhost:4000`.

## How to Add/Update Mock Data

As a non-technical user, you don't even need to add data manually! The easiest way is to open the **Frontend App** and click the **Simulate Events** buttons at the top of the dashboard. This generates events as if real users were using the product.

If you want to modify the mock **Team Members** (e.g., changing names or adding more people to the demo account):
1. Open the file `backend/migrations/001_init.sql`.
2. Scroll to the bottom to find the section titled `Seed data for local development`.
3. You can edit names like 'Alice' or 'Bob', change their emails, or copy/paste a row to create a new user. Keep the same `account_id` if you want them on the same team.
4. Save the file and then apply changes by running this command in your terminal from the `backend/` folder:
   ```bash
   psql -d usage_insights -f migrations/001_init.sql
   ```

## Running Tests
To run the automated tests:
```bash
npm test
```
