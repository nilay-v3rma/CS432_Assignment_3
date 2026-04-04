import json
import os

class WALLogger:
    def __init__(self, log_filepath="db_transaction.log"):
        self.filepath = log_filepath
        # Create the file if it doesn't exist
        if not os.path.exists(self.filepath):
            with open(self.filepath, 'a') as f:
                pass

    def append_log(self, tx_id, operation, table_name, key, old_value=None, new_value=None):
        """
        Appends a log record to the WAL file.
        operation: 'INSERT', 'UPDATE', 'DELETE', 'BEGIN', 'COMMIT', 'ROLLBACK'
        """
        log_entry = {
            "tx_id": tx_id,
            "operation": operation,
            "table_name": table_name,
            "key": key,
            "old_value": old_value,
            "new_value": new_value
        }
        
        # Write to disk and force flush to guarantee Durability
        with open(self.filepath, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
            f.flush()
            os.fsync(f.fileno())

    def read_log(self):
        """Reads the entire log file line by line for Recovery."""
        logs = []
        if os.path.exists(self.filepath):
            with open(self.filepath, 'r') as f:
                for line in f:
                    if line.strip():
                        logs.append(json.loads(line.strip()))
        return logs

    def clear_log(self):
        """Clears the log file (usually done after a successful system checkpoint)."""
        with open(self.filepath, 'w') as f:
            pass