import threading
import time

class LockManager:
    def __init__(self):
        # Dictionary mapping (table_name, key) -> tx_id
        self.locks = {}
        # A mutex latch to protect the lock dictionary itself in multi-threaded environments
        self.latch = threading.Lock()

    def acquire_lock(self, tx_id, table_name, key):
        """
        Attempts to acquire an exclusive row-level lock.
        If another transaction holds the lock, it will wait (block) until it is released.
        """
        lock_key = (table_name, key)
        while True:
            with self.latch:
                # If it's unlocked, or if THIS transaction already holds it
                if lock_key not in self.locks or self.locks[lock_key] == tx_id:
                    self.locks[lock_key] = tx_id
                    return True
            
            # If locked by someone else, sleep briefly and retry (simple blocking)
            time.sleep(0.01)

    def release_all(self, tx_id):
        """
        Releases all locks held by a specific transaction. 
        Called automatically during COMMIT or ROLLBACK.
        """
        with self.latch:
            # Identify all lock keys owned by this tx_id
            keys_to_release = [k for k, v in self.locks.items() if v == tx_id]
            for k in keys_to_release:
                del self.locks[k]