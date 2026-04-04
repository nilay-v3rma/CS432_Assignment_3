from table import Table
from wal import WALLogger
from lock_manager import LockManager

class DatabaseManager:

    def __init__(self, log_filepath="db_transaction.log"):
        self.databases = {}  
        self.wal = WALLogger(log_filepath) # Initialize the WAL logger
        self.lock_manager = LockManager() # Initialize the Lock Manager

    def create_database(self, db_name):
        """
        Create a new database with the given name.
        Initializes an empty dictionary for tables within this database.
        """
        if db_name in self.databases:
            raise ValueError(f"Database '{db_name}' already exists.")
        self.databases[db_name] = {}

    def delete_database(self, db_name):
        """
        Delete an existing database and all its tables.
        """
        if db_name not in self.databases:
            raise ValueError(f"Database '{db_name}' does not exist.")
        del self.databases[db_name]

    def list_databases(self):
        """
        Return a list of all database names currently managed.
        """
        return list(self.databases.keys())

    def create_table(self, db_name, table_name, schema, order=8, search_key=None):
        """
        Create a new table within a specified database.
        - schema: dictionary of column names and data types
        - order: B+ tree order for indexing
        - search_key: field name to use as the key in the B+ Tree
        """
        if db_name not in self.databases:
            raise ValueError(f"Database '{db_name}' does not exist.")
        if table_name in self.databases[db_name]:
            raise ValueError(f"Table '{table_name}' already exists in database '{db_name}'.")
        self.databases[db_name][table_name] = Table(table_name, schema, order, search_key)

    def delete_table(self, db_name, table_name):
        """
        Delete a table from the specified database.
        """
        if db_name not in self.databases:
            raise ValueError(f"Database '{db_name}' does not exist.")
        if table_name not in self.databases[db_name]:
            raise ValueError(f"Table '{table_name}' does not exist in database '{db_name}'.")
        del self.databases[db_name][table_name]

    def list_tables(self, db_name):
        """
        List all tables within a given database.
        """
        if db_name not in self.databases:
            raise ValueError(f"Database '{db_name}' does not exist.")
        return list(self.databases[db_name].keys())

    def get_table(self, db_name, table_name):
        """
        Retrieve a Table instance from a given database.
        Useful for performing operations like insert, update, delete on that table.
        """
        if db_name not in self.databases:
            raise ValueError(f"Database '{db_name}' does not exist.")
        if table_name not in self.databases[db_name]:
            raise ValueError(f"Table '{table_name}' does not exist in database '{db_name}'.")
        return self.databases[db_name][table_name]
    
    def begin_transaction(self):
        from transaction_manager import Transaction
        # Pass the lock manager into the transaction
        return Transaction(self.wal, self, self.lock_manager)
        
    def run_recovery(self):
        from recovery import RecoveryManager
        rm = RecoveryManager(self, self.wal)
        rm.recover()
