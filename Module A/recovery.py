class RecoveryManager:
    def __init__(self, db_manager, wal):
        self.db_manager = db_manager
        self.wal = wal

    def recover(self):
        """Reads the WAL and rebuilds the B+ Trees in memory."""
        print("Starting system recovery from WAL...")
        logs = self.wal.read_log()
        
        if not logs:
            print("WAL is empty. Starting fresh.")
            return

        # Step 1: Identify which transactions actually committed
        committed_txs = set()
        for log in logs:
            if log["operation"] == "COMMIT":
                committed_txs.add(log["tx_id"])

        # Step 2: Replay (REDO) operations ONLY for committed transactions
        operations_applied = 0
        for log in logs:
            tx_id = log["tx_id"]
            op = log["operation"]
            
            # Skip BEGIN, COMMIT, ROLLBACK tags, and skip uncommitted transactions
            if op in ["BEGIN", "COMMIT", "ROLLBACK"] or tx_id not in committed_txs:
                continue

            # Fetch the table and apply the data directly to the B+ Tree
            # We assume the database and tables are already created before recovery runs
            table = self.db_manager.get_table("EntryGateDB", log["table_name"])
            
            if op == "INSERT":
                table.data.insert(log["key"], log["new_value"])
            elif op == "UPDATE":
                table.data.update(log["key"], log["new_value"])
            elif op == "DELETE":
                table.data.delete(log["key"])
                
            operations_applied += 1

        print(f"Recovery complete. Applied {operations_applied} operations from {len(committed_txs)} committed transactions.")