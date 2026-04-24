# Usage Insights

This is a full-stack SaaS application feature that lets users understand how their team uses the product. It collects event data in real-time, presents usage charts, and sends alerts when usage crosses defined thresholds.

This project is built using:
- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** React, Vite, Recharts

## Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** (e.g., via Homebrew `brew install postgresql@14`)

---

## 1. Backend Setup & Running
This backend handles event ingestion, usage aggregations, and threshold alerts.

1. **Install Dependencies:**
   ```bash
   cd backend
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
   The backend API will now be running on `http://localhost:4000`.

*(Optional) To run backend tests, run `npm test` inside the `backend/` folder.*

---

## 2. Frontend Setup & Running
The frontend presents a premium, user-friendly dashboard with custom charts and real-time alert history.

1. **Open a new terminal window** (keep the backend server running!).
2. **Install Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Open the App:**
   Visit `http://localhost:5173` in your browser.

---

## How to Use the App & Generate Mock Data

To make it incredibly easy for anyone to assess this assignment, we built a **Simulate Events** feature directly into the user interface. You don't need to manually insert data into the database!

### 1. Generating Mock Event Data
At the top of the Insights Dashboard, you'll see a row of **Simulate Events** buttons (e.g., "Dashboard view", "Export data"). 
- Click these buttons repeatedly to pretend you are a user interacting with the platform. 
- Every click sends an event to the backend, inserting it into the database, and magically updates the charts instantly.

### 2. Testing Alert Thresholds
- On the right sidebar, find **Add Alert Threshold**.
- Select a feature (for example, "dashboard").
- Set the window to "1" day and the limit count to "3". Click **Create Threshold**.
- Now, click the "Dashboard view" simulate button 3 times in a row.
- You will see the limit gets crossed, and a notification will show up shortly after in the **Triggered Alerts History** panel below it!

### 3. Modifying the Demo User Identity
By default, the UI logs all actions as "Alice" to make it simple. If you want to log events as a different user:
1. Open `frontend/src/api/client.js` in a text editor.
2. Find the line:
   ```javascript
   export const DEMO_USER_ID = 'b0000000-0000-0000-0000-000000000001';
   ```
3. Change the `0000001` at the end to `0000002` (which belongs to "Bob", as defined in the initial DB). 
4. The page will reload. From then on, any "Simulate Events" clicks will correctly register under Bob's name when you group the chart by "Team Member"!

*(To edit the actual accounts/user names entirely, you can edit `backend/migrations/001_init.sql` and run `psql -d usage_insights -f migrations/001_init.sql` again from the backend folder!)*