# PERFORMANCE AUDIT REPORT

This report highlights scalability bottlenecks, heavy queries, and CPU/Memory constraints.

## 1. N+1 Query Problems
- **Severity:** Medium
- **Affected Module:** `Orders`, `Customers`
- **Why it matters:** Fetching a list of 50 orders, and then running a separate query to fetch the customer for each order results in 51 queries instead of 1.
- **Risk Impact:** Database connection pool exhaustion and slow response times.
- **Recommended Fix:** Ensure all list endpoints use Prisma's `include` feature rather than fetching relations in a loop. Prisma handles `include` via optimized JOINs or single batch queries.

## 2. Heavy Dashboard Aggregations
- **Severity:** High
- **Affected Module:** `DashboardService`
- **Why it matters:** The dashboard performs live `GROUP BY` and `SUM` operations on the `Order` and `Payment` tables to calculate live KPIs.
- **Risk Impact:** As the database grows to hundreds of thousands of rows, these live aggregations will stall the CPU and lock rows, killing performance.
- **Recommended Fix:** Implement a Materialized View for dashboard stats, or use a CRON job to aggregate data nightly into a `DailyStats` table, serving the dashboard from the pre-calculated table.

## 3. AI Context Builder Token Limits
- **Severity:** High
- **Affected Module:** `AIAssistantModule`
- **Why it matters:** The current MVP approach passes raw data strings into the LLM context window.
- **Risk Impact:** LLMs have strict token limits (e.g., 128k tokens for GPT-4). Passing thousands of rows of inventory or sales data will easily exceed this limit, causing the AI API to return a 400 Error. It is also extremely expensive.
- **Recommended Fix:** 
  1. Do not feed raw lists. 
  2. Implement RAG (Retrieval-Augmented Generation) with Vector DBs for semantic search.
  3. Pre-aggregate data before passing to the LLM (e.g., pass "Total Sales: $X" instead of all 10,000 order rows).
