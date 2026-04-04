import uuid

class Transaction:
    def __init__(self, wal, db_manager, lock_manager):
        self.tx_id = str(uuid.uuid4())
        self.wal = wal
        self.db_manager = db_manager
        self.lock_manager = lock_manager  # NEW
        self.status = "ACTIVE"
        self.operations = [] 
        
        self.wal.append_log(self.tx_id, "BEGIN", None, None, None, None)

    def register_operation(self, operation, table_name, key, old_value, new_value):
        if self.status != "ACTIVE":
            raise Exception("Cannot operate on a closed transaction.")
            
        # This guarantees Isolation
        self.lock_manager.acquire_lock(self.tx_id, table_name, key)
            
        # 2. Log it to the disk (Write-Ahead)
        self.wal.append_log(self.tx_id, operation, table_name, key, old_value, new_value)
        
        # 3. Remember it in case we need to rollback
        self.operations.append({
            "operation": operation,
            "table_name": table_name,
            "key": key,
            "old_value": old_value,
            "new_value": new_value
        })

    def commit(self):
        if self.status != "ACTIVE":
            raise Exception("Transaction already closed.")
            
        self.wal.append_log(self.tx_id, "COMMIT", None, None, None, None)
        self.status = "COMMITTED"
        
        # Release all locks upon commit
        self.lock_manager.release_all(self.tx_id)
        return True

    def rollback(self):
        if self.status != "ACTIVE":
            raise Exception("Transaction already closed.")
            
        print(f"\n[!] Rolling back transaction {self.tx_id}...")
        
        for op in reversed(self.operations):
            table = self.db_manager.get_table("EntryGateDB", op["table_name"])
            
            if op["operation"] == "INSERT":
                table.data.delete(op["key"]) 
            elif op["operation"] == "DELETE":
                table.data.insert(op["key"], op["old_value"])
            elif op["operation"] == "UPDATE":
                table.data.update(op["key"], op["old_value"])

        self.wal.append_log(self.tx_id, "ROLLBACK", None, None, None, None)
        self.status = "ROLLED_BACK"
        
        # Release all locks upon rollback
        self.lock_manager.release_all(self.tx_id)
        print("[!] Rollback complete and locks released.")
        return True