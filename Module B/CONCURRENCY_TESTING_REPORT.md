# Concurrency and Transaction Correctness Audit & Fixes Report

**Date:** April 4, 2026  
**Module:** Module B (Backend Application)  
**Objective:** Prepare the Express & SQLite backend for concurrent testing, heavy load testing, and ensure single-node transaction correctness (ACID properties).

---

## Executive Summary
Prior to this audit, the backend relied on automatic, sequential query execution without transactional boundaries. Under concurrent load, this would have resulted in partial writes (orphaned records), `SQLITE_BUSY` application crashes, and severe Time-Of-Check to Time-Of-Use (TOCTOU) race conditions (e.g., duplicate IDs, double QR scans).

Following the audit, the database connection has been optimized for concurrent throughput, multi-step write operations have been safely wrapped in locked transactions, and a dedicated error-logging interceptor has been implemented to establish clear observability during stress tests. 

---

## 1. Database Configuration & Durability
**File Changed:** `app/server.js`

**Issues Identified:**
* Native SQLite locks the entire database file sequentially on every write. Under concurrent testing, this immediately causes `SQLITE_BUSY` errors crashing the event loop.

**Fixes Applied:**
* **Write-Ahead Logging (WAL):** Executed `PRAGMA journal_mode = WAL;` upon database initialization. This enables concurrent readers to access the database while it is locked for writing, exponentially increasing concurrent throughput.
* **Busy Timeout Queue:** Executed `PRAGMA busy_timeout = 5000;`. When multiple concurrent threads try to write simultaneously, they will now queue and wait up to 5 seconds rather than instantly throwing an error and dropping the request.

---

## 2. Transaction Correctness & Atomicity
**Files Changed:** `app/routes/members.js`, `app/routes/guests.js`, `app/routes/logs.js`

**Issues Identified:**
* Multi-step `INSERT` operations (e.g., adding to `person_info` and then `member`) were chained purely via Node.js callbacks. If the second insert failed (due to a UNIQUE constraint), the `person_info` record was kept permanently, creating orphaned data (partial updates).

**Fixes Applied:**
* Wrapped critical, multi-statement writes inside `db.run('BEGIN EXCLUSIVE TRANSACTION')`.
* Bound `db.run('ROLLBACK')` directly to intermediate query errors to securely unwind partial states before returning `500` status codes.
* Bound `db.run('COMMIT')` to the successful conclusion of the callback chain.

---

## 3. Consistency & Isolation (Race Conditions)
**Files Changed:** `app/routes/guests.js`, `app/routes/logs.js`

**Issues Identified:**
* **`guests.js` (ID Generation):** The route read `SELECT COUNT(*) FROM guest` to manually sequence the ID (e.g., `GUEST_05`) before inserting. Under concurrency, 10 parallel requests could all read `COUNT() = 4` and trigger cascading PK constraint failures.
* **`logs.js` (QR Scanning):** The scan logic checks `in_campus_flag`, computes the state, toggles it, and inserts a log. A rapid double-scan could bypass the security check before the first request finishes writing.

**Fixes Applied:**
* By asserting an `EXCLUSIVE` transaction boundary *before* the first `SELECT` check, concurrent API requests are forced to serialize at the database level. No secondary request can step in to read the `COUNT()` or the `in_campus_flag` until the first transaction cleanly COMMITS or ROLLBACKS.

---

## 4. Logging & Observability
**File Changed:** `app/server.js`

**Issues Identified:**
* The `morgan` logger was successfully tracking HTTP statuses in `logs/audit.log` (e.g., yielding `500 Internal Server Error`), but the actual underlying database crash reasons (like "UNIQUE constraint failed") were only dumped to the volatile `stdout` via `console.error()`. This makes diagnosing failures during high-scale stress testing impossible.

**Fixes Applied:**
* Created an `errorLogStream` pointing to `logs/error.log`.
* Overrode and intercepted the global Node.js `console.error` method so that every internal error string is reliably stringified, timestamped, appended to the `error.log` file, and then released to standard output. 

---

## Conclusion & Readiness
The gateguard backend system (Module B) is now fully hardened for single-node concurrent workloads.
* **Race Conditions:** Nullified via EXCLUSIVE transactions.
* **Partial Writes:** Nullified via strict explicitly managed ROLLBACKs.
* **Concurrency Crashes:** Mitigated via WAL and 5000ms busy_timeout scaling.
* **Observability:** Traceable across HTTP audits and detached Error logs.

You can safely proceed with stress/load tests.