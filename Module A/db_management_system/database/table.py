from bplustree import BPlusTree

class Table:
    def __init__(self, name, schema, order=8, search_key=None):
        self.name = name                             # Name of the table
        self.schema = schema                         # Table schema: dict of {column_name: data_type}
        self.order = order                           # Order of the B+ Tree (max number of children)
        self.data = BPlusTree(order=order)           # Underlying B+ Tree to store the data
        self.search_key = search_key                 # Primary or search key used for indexing (must be in schema)

    def validate_record(self, record):
        """
        Validate that the given record matches the table schema:
        - All required columns are present
        - Data types are correct
        """
        # Check all schema keys are present
        for col, dtype in self.schema.items():
            if col not in record:
                raise ValueError(f"Missing column: {col}")
            if not isinstance(record[col], dtype):
                raise TypeError(f"Column {col} expects {dtype}, got {type(record[col])}")
        # Check no extra columns
        for col in record:
            if col not in self.schema:
                raise ValueError(f"Unknown column: {col}")
        return True

    def insert(self, record):
        """
        Insert a new record into the table.
        The record should be a dictionary matching the schema.
        The key used for insertion should be the value of the `search_key` field.
        """
        self.validate_record(record)
        key = record[self.search_key]
        self.data.insert(key, record)

    def get(self, record_id):
        """
        Retrieve a single record by its ID (i.e., the value of the `search_key`)
        """
        return self.data.search(record_id)

    def get_all(self):
        """
        Retrieve all records stored in the table in sorted order by search key
        """
        return [v for k, v in self.data.get_all()]

    def update(self, record_id, new_record):
        """
        Update a record identified by `record_id` with `new_record` data.
        Usually overwrites the existing entry.
        """
        self.validate_record(new_record)
        return self.data.update(record_id, new_record)

    def delete(self, record_id):
        """
        Delete the record from the table by its `record_id`
        """
        return self.data.delete(record_id)

    def range_query(self, start_value, end_value):
        """
        Perform a range query using the search key.
        Returns records where start_value <= key <= end_value
        """
        return [v for k, v in self.data.range_query(start_value, end_value)]
