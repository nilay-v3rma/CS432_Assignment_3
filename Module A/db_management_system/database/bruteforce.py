class BruteForceDB:
	def __init__(self):
		self.data = []  # List of (key, value) tuples

	def insert(self, key, value):
		# Insert key-value, replace if key exists
		for i, (k, v) in enumerate(self.data):
			if k == key:
				self.data[i] = (key, value)
				return
		self.data.append((key, value))

	def search(self, key):
		for k, v in self.data:
			if k == key:
				return v
		return None

	def delete(self, key):
		for i, (k, v) in enumerate(self.data):
			if k == key:
				self.data.pop(i)
				return True
		return False

	def update(self, key, new_value):
		for i, (k, v) in enumerate(self.data):
			if k == key:
				self.data[i] = (key, new_value)
				return True
		return False

	def range_query(self, start_key, end_key):
		return [(k, v) for k, v in self.data if start_key <= k <= end_key]

	def get_all(self):
		return sorted(self.data, key=lambda x: x[0])
