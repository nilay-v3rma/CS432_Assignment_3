# Database Concurrency and Load Testing Experiments

## 1. Overview
This directory contains a suite of Locust experiments designed to test the concurrency, performance, and transactional integrity of the backend system and its underlying custom B+ Tree database. The test suite evaluates whether the system correctly handles high load, concurrent resource modifications, race conditions, and mid-transaction failures.

## 2. Scripts Description
* **`scripts/exp1_concurrent_updates.py`**: Tests isolation and consistency by having multiple simulated users rapidly attempt to update the exact same resource (e.g., Gate updates).
* **`scripts/exp2_race_condition.py`**: Simulates a "stampede" scenario where many users attempt to claim the exact same limited resource simultaneously. Designed to detect race conditions like double-selling.
* **`scripts/exp3_failure_simulation.py`**: Submits transactions flagged to fail midway through execution across multiple endpoints (guest requests, gate updates, blacklist additions). Designed to verify that the database correctly rolls back changes (Atomicity).
* **`scripts/exp4_stress_test.py`**: Floods the API with a heavy mix of read and write requests (e.g., fetching logs and writing entry/exit logs) to measure system stability, throughput, and latency under high concurrency.

## 3. How to Run the Experiments
The easiest way to run the entire suite and automatically save the results to `results_automated/*.txt` is by using the automation script:
```bash
./experiments/run_tests.sh
```
This script will sequentially launch each experiment and provide you with a URL (`http://localhost:8089`) to control and analyze the test in your browser.

Alternatively, you can run each experiment manually from the root of the workspace:

Experiment 1: Concurrent Updates
```bash
locust -f experiments/scripts/exp1_concurrent_updates.py --host=http://localhost:3000
```

Experiment 2: Race Condition
```bash
locust -f experiments/scripts/exp2_race_condition.py --host=http://localhost:3000
```

Experiment 3: Failure Simulation
```bash
locust -f experiments/scripts/exp3_failure_simulation.py --host=http://localhost:3000
```

Experiment 4: Stress Test
```bash
locust -f experiments/scripts/exp4_stress_test.py --host=http://localhost:3000
```
*Note: Locust provides a Web UI at `http://localhost:8089` to configure user count and spawn rate and start the test.*

## 4. What to Observe

### Experiment 1: Concurrent Updates
* **Expected Behavior:** Endpoint returns 200s or 409s. No 5xx errors. Upon validation, the database reflects exactly one of the updates without any data corruption.
* **Failure Indicators:** Database crashes, deadlocks, or the final state shows corrupted or merged data.

### Experiment 2: Race Condition
* **Expected Behavior:** Only the permitted number of users succeed (e.g., 1 user gets HTTP 200). All other concurrent requests correctly fail with an expected error (e.g., 400 or 409).
* **Failure Indicators:** Multiple users succeed in claiming the same unique resource, leading to inconsistent state (overselling).

### Experiment 3: Failure Simulation
* **Expected Behavior:** Rejection of the failing request (HTTP 4xx or 5xx). The database state remains completely unchanged; no partial modifications are committed.
* **Failure Indicators:** The database maintains partial records from the aborted transaction.

### Experiment 4: Stress Test
* **Expected Behavior:** The system handles the target load (e.g., 500-1000 users) without crashing. Response times might degrade, but the error rate remains at 0%.
* **Failure Indicators:** High error rates, connection timeouts, or the backend Node process crashing under load.

## 5. Mapping to ACID Properties
* **Atomicity**: Validated by **Experiment 3**. Ensures that a transaction is completely applied or fully rolled back if a failure occurs.
* **Consistency**: Validated by **Experiment 2**. Ensures that concurrency does not allow the database to enter an invalid state (e.g., bypassing restrictions).
* **Isolation**: Validated by **Experiment 1**. Guarantees that concurrent transactions attempting to modify the same data do not interfere with one another.
* **Durability**: Tested implicitly throughout the suite. Ensures that any completed (HTTP 200) write across all experiments remains safely persisted.
