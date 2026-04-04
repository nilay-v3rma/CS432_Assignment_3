# Database Indexing Performance Report

**Date:** March 22, 2026  
**Module:** Module B (GateGuard System)  
**Database Tool:** SQLite  

## Overview
As the application scales, querying thousands of rows in the `people_log` and `person_info` tables can cause noticeable latency, especially when filtering by date or joining tables to classify users. To address this, we profiled three major queries representing real-world bottlenecks, applied relevant indices, and compared the execution speeds.

This document details the benchmarking environment, the proposed indexing strategy, and the performance differences.

---

## 1. Benchmarking Environment

To avoid impacting the main database (`gateguard.db`), testing was performed on a clone (`gateguard_test.db`). 

A synthetic data generation script was executed to populate the test database with a sufficiently large dataset so performance gaps became measurable:
- **`person_info` Table:** ~5,000 generated records (`type` distribution roughly 50% members, 40% visitors, 10% guests).
- **`people_log` Table:** ~25,000 generated records linked to users, passing through 4 hypothetical gates.

Execution times were measured in Node.js using `process.hrtime.bigint()`. To account for caching and CPU fluctuations, each query was run **5 times** and the results averaged.

---

## 2. Tested Queries & Their Purpose

### Query 1: Narrow Date Range Filtering (Log Lookup)
Simulating the admin dashboard searching for all entries and exits inside a specific window.
```sql
SELECT * FROM people_log 
WHERE time BETWEEN '2026-01-01 00:00:00' AND '2026-02-15 23:59:59'
```

### Query 2: Joining and Filtering (Identifying Active Guests)
Simulating finding specific details about guests currently walking through the gate by linking their core information with their log events.
```sql
SELECT p.person_id, p.type, l.log_type, l.time 
FROM person_info p 
JOIN people_log l ON p.person_id = l.person_id 
WHERE p.type = 'guest' AND l.log_type = 'entry' AND l.time > '2026-02-01'
```

### Query 3: Multi-column Aggregation (Count Entries per Gate)
Simulating traffic statistics and generating charts by counting the number of strictly "entry" logs per gate after a specific date. 
```sql
SELECT gate_id, COUNT(*) 
FROM people_log 
WHERE log_type = 'entry' AND time > '2026-03-01' 
GROUP BY gate_id
```

---

## 3. The Indexing Strategy

Before indexing, these queries relied heavily on **full table scans**. By reading every single row to check if the `WHERE` clause matched, SQLite wasted significant CPU time. To prevent this, three specific indices were introduced:

### Index A: `idx_people_log_time`
```sql
CREATE INDEX idx_people_log_time ON people_log (time);
```
**Rationale:** Standard B-Tree index on the chronological `time` field to dramatically speed up Query 1.

### Index B: `idx_person_info_type_status`
```sql
CREATE INDEX idx_person_info_type_status ON person_info (type, status);
```
**Rationale:** A composite index. Since we frequently query users by their classification (member vs guest) and whether they are active, indexing `type` and `status` together allows the database engine to isolate these exact user groups instantly before attempting a costly `JOIN`.

### Index C: `idx_people_log_type_time` (Covering Index)
```sql
CREATE INDEX idx_people_log_type_time ON people_log (log_type, time, gate_id);
```
**Rationale:** A highly specialized covering index primarily aimed at Query 3. Because `COUNT()` and `GROUP BY` only care about `log_type`, `time`, and `gate_id`, by placing all three in an index, SQLite never actually has to access the `people_log` table itself. It can calculate the totals directly from the index.

---

## 4. Performance Results

The table below highlights the average execution time (in milliseconds) required to fetch the data before and after the indices were applied:

| Target Query | Before Indexing | After Indexing | Improvement % | Rows Retrieved |
|--------------|-----------------|----------------|---------------|----------------|
| **Q1: Narrow Date Range** | 42.31 ms | 40.63 ms | **~ 4.0% faster** | 11,689 |
| **Q2: Guest Details (JOIN)** | 8.40 ms | 6.82 ms | **~ 18.9% faster** | 594 |
| **Q3: Aggregated Gate Entries** | 9.09 ms | 1.02 ms | **~ 88.8% faster** | 2 |

### Analysis:
- **Q1 Improvement was mild (4%):** While an index was used, the query asked for `SELECT *` and matched a very wide band of rows (~11,000 out of 25,000). The database engine still has to do significant disk swapping to retrieve that many row payloads.
- **Q2 Improvement was solid (19%):** Pre-filtering tables via the `type` index drastically lowered the number of rows SQLite had to evaluate in the loop connection (the `JOIN`).
- **Q3 Improvement was drastic (89%):** The "Covering Index" completely circumvented full table scanning. The execution speed is reduced to roughly 1 millisecond.

---

## 5. Conclusion & Next Steps

Adding standard and composite covering indices is highly recommended to improve application scaling. If these tables grow to 100,000+ rows, the full table scans required by the lack of indices will bottleneck API response times. 

**Recommendations:**
1. Append the three `CREATE INDEX` statements to the `Module B/sql/GateGuard_Almonds_Dump_File.sql` schema so future setups inherit these optimizations out of the box.
2. If `people_log` queries commonly rely on `log_type`, `time`, and `gate_id`, prioritize inserting the `idx_people_log_type_time` covering index in production.