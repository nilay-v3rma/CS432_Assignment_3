import time
import tracemalloc
import random
import math
from statistics import mean, stdev

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from IPython.display import display

from bplustree import BPlusTree
from bruteforce import BruteForceDB

# Reproducibility
RNG = random.Random(432)
np.random.seed(432)

plt.style.use("seaborn-v0_8-whitegrid")
plt.rcParams["figure.figsize"] = (11, 5)
plt.rcParams["axes.titlesize"] = 12
plt.rcParams["axes.labelsize"] = 10

# Balanced defaults: detailed enough for analysis, practical runtime for notebook execution.
SIZES = [500, 1000, 2000, 4000, 6000]
REPEATS = 3
BPLUS_ORDER = 16


def make_bplustree():
    return BPlusTree(order=BPLUS_ORDER)


def make_bruteforce():
    return BruteForceDB()


STRUCTURES = {
    "B+ Tree": make_bplustree,
    "Brute Force": make_bruteforce,
}


def ns_to_ms(ns):
    return ns / 1_000_000.0


def timed_ns(func):
    t0 = time.perf_counter_ns()
    func()
    t1 = time.perf_counter_ns()
    return t1 - t0


def safe_stdev(values):
    return stdev(values) if len(values) > 1 else 0.0


def generate_keys(n, case_name):
    if case_name == "random":
        return RNG.sample(range(n * 20), n)
    if case_name == "ascending":
        return list(range(n))
    if case_name == "descending":
        return list(range(n, 0, -1))
    if case_name == "clustered":
        # Many keys in a narrow value band, then made unique and shuffled.
        base = [RNG.randint(0, max(10, n // 10)) for _ in range(n * 2)]
        uniq = list(dict.fromkeys(base))
        while len(uniq) < n:
            uniq.append(max(uniq) + 1)
        keys = uniq[:n]
        RNG.shuffle(keys)
        return keys
    raise ValueError(f"Unknown case_name={case_name}")


def build_structure(factory, keys):
    ds = factory()
    for k in keys:
        ds.insert(k, {"id": k, "payload": k * 7})
    return ds


def summarize_records(records):
    df = pd.DataFrame(records)
    if not df.empty:
        df = df.sort_values(["size", "structure", "case"]).reset_index(drop=True)
    return df


def benchmark_insertion(sizes=SIZES, repeats=REPEATS, cases=("random", "ascending", "descending", "clustered")):
    rows = []
    for size in sizes:
        for case_name in cases:
            keys = generate_keys(size, case_name)
            values = [{"id": k, "payload": k * 3} for k in keys]
            for structure_name, factory in STRUCTURES.items():
                trials = []
                for _ in range(repeats):
                    ds = factory()
                    elapsed = timed_ns(lambda: [ds.insert(k, v) for k, v in zip(keys, values)])
                    trials.append(elapsed)
                rows.append({
                    "operation": "insert",
                    "structure": structure_name,
                    "case": case_name,
                    "size": size,
                    "time_ms_mean": ns_to_ms(mean(trials)),
                    "time_ms_std": ns_to_ms(safe_stdev(trials)),
                })
    return summarize_records(rows)


def benchmark_search(sizes=SIZES, repeats=REPEATS, cases=("existing", "missing", "mixed")):
    rows = []
    for size in sizes:
        base_keys = generate_keys(size, "random")
        missing_keys = [k + size * 50 for k in base_keys]
        for structure_name, factory in STRUCTURES.items():
            ds = build_structure(factory, base_keys)

            query_sets = {
                "existing": base_keys,
                "missing": missing_keys,
                "mixed": [base_keys[i] if i % 2 == 0 else missing_keys[i] for i in range(len(base_keys))],
            }

            for case_name in cases:
                q = query_sets[case_name]
                trials = []
                for _ in range(repeats):
                    elapsed = timed_ns(lambda: [ds.search(x) for x in q])
                    trials.append(elapsed)
                rows.append({
                    "operation": "search",
                    "structure": structure_name,
                    "case": case_name,
                    "size": size,
                    "time_ms_mean": ns_to_ms(mean(trials)),
                    "time_ms_std": ns_to_ms(safe_stdev(trials)),
                })
    return summarize_records(rows)


def benchmark_update(sizes=SIZES, repeats=REPEATS, cases=("random", "ascending")):
    rows = []
    for size in sizes:
        base_keys = generate_keys(size, "random")
        for structure_name, factory in STRUCTURES.items():
            for case_name in cases:
                update_keys = base_keys.copy()
                if case_name == "ascending":
                    update_keys.sort()
                else:
                    RNG.shuffle(update_keys)

                ds = build_structure(factory, base_keys)
                trials = []
                for _ in range(repeats):
                    elapsed = timed_ns(lambda: [ds.update(k, {"id": k, "payload": k * 11}) for k in update_keys])
                    trials.append(elapsed)
                rows.append({
                    "operation": "update",
                    "structure": structure_name,
                    "case": case_name,
                    "size": size,
                    "time_ms_mean": ns_to_ms(mean(trials)),
                    "time_ms_std": ns_to_ms(safe_stdev(trials)),
                })
    return summarize_records(rows)


def benchmark_deletion(sizes=SIZES, repeats=REPEATS, cases=("ascending", "descending", "random")):
    rows = []
    for size in sizes:
        base_keys = generate_keys(size, "random")
        for structure_name, factory in STRUCTURES.items():
            for case_name in cases:
                del_keys = sorted(base_keys)
                if case_name == "descending":
                    del_keys = list(reversed(del_keys))
                elif case_name == "random":
                    del_keys = base_keys.copy()
                    RNG.shuffle(del_keys)

                trials = []
                for _ in range(repeats):
                    ds = build_structure(factory, base_keys)
                    elapsed = timed_ns(lambda: [ds.delete(k) for k in del_keys])
                    trials.append(elapsed)
                rows.append({
                    "operation": "delete",
                    "structure": structure_name,
                    "case": case_name,
                    "size": size,
                    "time_ms_mean": ns_to_ms(mean(trials)),
                    "time_ms_std": ns_to_ms(safe_stdev(trials)),
                })
    return summarize_records(rows)


def benchmark_range_query(sizes=SIZES, repeats=REPEATS, cases=("narrow", "medium", "wide")):
    rows = []
    for size in sizes:
        keys = generate_keys(size, "random")
        lo, hi = min(keys), max(keys)

        widths = {
            "narrow": max(5, (hi - lo) // 200),
            "medium": max(20, (hi - lo) // 40),
            "wide": max(50, (hi - lo) // 8),
        }

        for structure_name, factory in STRUCTURES.items():
            ds = build_structure(factory, keys)
            for case_name in cases:
                width = widths[case_name]
                queries = []
                for _ in range(min(300, size)):
                    a = RNG.randint(lo, hi)
                    b = min(hi, a + width)
                    queries.append((a, b))

                trials = []
                for _ in range(repeats):
                    elapsed = timed_ns(lambda: [ds.range_query(a, b) for a, b in queries])
                    trials.append(elapsed)

                rows.append({
                    "operation": "range_query",
                    "structure": structure_name,
                    "case": case_name,
                    "size": size,
                    "time_ms_mean": ns_to_ms(mean(trials)),
                    "time_ms_std": ns_to_ms(safe_stdev(trials)),
                })
    return summarize_records(rows)


def benchmark_mixed_workload(sizes=SIZES, repeats=REPEATS):
    rows = []
    for size in sizes:
        seed_keys = generate_keys(size, "random")
        operations = ["insert", "search", "delete", "update", "range"]
        for structure_name, factory in STRUCTURES.items():
            trials = []
            for _ in range(repeats):
                ds = build_structure(factory, seed_keys)
                next_key = max(seed_keys) + 1

                def run_workload():
                    nonlocal next_key
                    for _ in range(size):
                        op = RNG.choice(operations)
                        if op == "insert":
                            ds.insert(next_key, {"id": next_key, "payload": next_key * 13})
                            next_key += 1
                        elif op == "search":
                            ds.search(RNG.choice(seed_keys))
                        elif op == "delete":
                            ds.delete(RNG.choice(seed_keys))
                        elif op == "update":
                            k = RNG.choice(seed_keys)
                            ds.update(k, {"id": k, "payload": k * 17})
                        else:
                            a = RNG.choice(seed_keys)
                            b = a + RNG.randint(1, max(3, size // 20))
                            ds.range_query(a, b)

                elapsed = timed_ns(run_workload)
                trials.append(elapsed)

            rows.append({
                "operation": "mixed_random",
                "structure": structure_name,
                "case": "mixed_ops",
                "size": size,
                "time_ms_mean": ns_to_ms(mean(trials)),
                "time_ms_std": ns_to_ms(safe_stdev(trials)),
            })
    return summarize_records(rows)


def benchmark_memory(sizes=SIZES, cases=("insert", "search", "delete", "range_query")):
    rows = []
    for size in sizes:
        keys = generate_keys(size, "random")
        for structure_name, factory in STRUCTURES.items():
            for case_name in cases:
                ds = build_structure(factory, keys)

                tracemalloc.start()
                if case_name == "insert":
                    start = max(keys) + 1
                    for i in range(size):
                        ds.insert(start + i, {"id": start + i, "payload": i})
                elif case_name == "search":
                    for k in keys:
                        ds.search(k)
                elif case_name == "delete":
                    for k in keys[: size // 2]:
                        ds.delete(k)
                else:
                    lo, hi = min(keys), max(keys)
                    for _ in range(max(10, size // 15)):
                        a = RNG.randint(lo, hi)
                        b = min(hi, a + max(3, size // 25))
                        ds.range_query(a, b)

                _, peak = tracemalloc.get_traced_memory()
                tracemalloc.stop()

                rows.append({
                    "operation": "memory_peak",
                    "structure": structure_name,
                    "case": case_name,
                    "size": size,
                    "memory_kb": peak / 1024.0,
                })
    return summarize_records(rows)


def plot_operation_grid(df, operation_title, y_col="time_ms_mean", y_label="Time (ms)"):
    cases = list(df["case"].unique())
    cols = 2
    rows = math.ceil(len(cases) / cols)
    fig, axes = plt.subplots(rows, cols, figsize=(14, 4 * rows), sharex=True)
    axes = np.array(axes).reshape(-1)

    for i, case_name in enumerate(cases):
        ax = axes[i]
        sub = df[df["case"] == case_name]
        for structure_name in sub["structure"].unique():
            part = sub[sub["structure"] == structure_name].sort_values("size")
            ax.plot(part["size"], part[y_col], marker="o", linewidth=2, label=structure_name)
            if "time_ms_std" in part.columns and y_col == "time_ms_mean":
                ax.fill_between(
                    part["size"],
                    part["time_ms_mean"] - part["time_ms_std"],
                    part["time_ms_mean"] + part["time_ms_std"],
                    alpha=0.15,
                )
        ax.set_title(f"Case: {case_name}")
        ax.set_xlabel("Input size (n)")
        ax.set_ylabel(y_label)
        ax.legend()

    for j in range(len(cases), len(axes)):
        axes[j].axis("off")

    fig.suptitle(operation_title, fontsize=14, y=1.02)
    plt.tight_layout()
    plt.show()


def show_speedup_table(df, operation_name):
    pivot = df.pivot_table(
        index=["size", "case"],
        columns="structure",
        values="time_ms_mean",
        aggfunc="mean",
    ).reset_index()

    if "Brute Force" in pivot.columns and "B+ Tree" in pivot.columns:
        pivot["speedup_(Brute/B+)"] = pivot["Brute Force"] / pivot["B+ Tree"]
    print(f"\nSpeedup summary for {operation_name}:")
    display(pivot.round(3))
