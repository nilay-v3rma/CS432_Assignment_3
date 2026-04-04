#!/bin/bash

# Configuration
URL="http://localhost:3000"
DURATION="20s"
RESULTS_DIR="experiments/results_automated"

# Ensure we are running from Module B root
cd "$(dirname "$0")/.." || exit 1

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "========================================================"
echo " Starting Automated Concurrency Test Suite "
echo "========================================================"
echo "Host: $URL"
echo "Duration per test: $DURATION"
echo "Results output directory: $RESULTS_DIR"
echo "--------------------------------------------------------"

echo "[1/4] Running Concurrent Updates Test (Isolation & Consistency)..."
python3 -m locust -f experiments/scripts/exp1_concurrent_updates.py \
    --headless -u 50 -r 10 -t "$DURATION" --host="$URL" \
    > "$RESULTS_DIR/exp1.txt" 2>&1
echo "      -> Saved to $RESULTS_DIR/exp1.txt"

echo "[2/4] Running Race Condition Test (Stampede Scenario)..."
python3 -m locust -f experiments/scripts/exp2_race_condition.py \
    --headless -u 50 -r 10 -t "$DURATION" --host="$URL" \
    > "$RESULTS_DIR/exp2.txt" 2>&1
echo "      -> Saved to $RESULTS_DIR/exp2.txt"

echo "[3/4] Running Failure Simulation Test (Atomicity/Rollbacks)..."
python3 -m locust -f experiments/scripts/exp3_failure_simulation.py \
    --headless -u 50 -r 10 -t "$DURATION" --host="$URL" \
    > "$RESULTS_DIR/exp3.txt" 2>&1
echo "      -> Saved to $RESULTS_DIR/exp3.txt"

echo "[4/4] Running Stress Test (Heavy Load & Indexing Benchmark)..."
python3 -m locust -f experiments/scripts/exp4_stress_test.py \
    --headless -u 100 -r 20 -t "$DURATION" --host="$URL" \
    > "$RESULTS_DIR/exp4.txt" 2>&1
echo "      -> Saved to $RESULTS_DIR/exp4.txt"

echo "--------------------------------------------------------"
echo "✅ All tests finished successfully!"
echo "Check the '$RESULTS_DIR' folder for detailed reports."
