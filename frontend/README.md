# Usage Insights - Frontend

This React and Vite application presents the Usage Insights dashboard. Wait. It provides a premium, user-friendly interface with custom charts and real-time alert history.

## Prerequisites
- Node.js (v18+)
- The backend API should be running on port 4000.

## Setup & Running Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   
3. **Open the App:**
   Visit `http://localhost:5173` in your browser.

## How to Use the App & Generate Mock Data

To make it incredibly easy for anyone (technical or non-technical) to assess this assignment, we built a **Simulate Events** feature directly into the user interface.

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
