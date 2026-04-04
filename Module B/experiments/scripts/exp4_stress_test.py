from locust import HttpUser, task, between
import random

class StressTestUser(HttpUser):
    # Very short wait times for high load simulation
    wait_time = between(0.01, 0.1)

    @task(4)
    def read_heavy_operation(self):
        # Simulate high-frequency reads
        resource_id = random.randint(1, 100)
        self.client.get(f"/api/resource/{resource_id}", name="/api/resource/[id]")

    @task(1)
    def write_heavy_operation(self):
        # Simulate ongoing writes amidst the read load
        payload = {
            "data": f"Stress test data {random.randint(1, 1000)}"
        }
        self.client.post("/api/resource", json=payload)
