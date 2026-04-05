from locust import HttpUser, task, between
import random

class StressTestUser(HttpUser):
    # Very short wait times for high load simulation
    wait_time = between(0.01, 0.1)
    token = None

    def on_start(self):
        # Authenticate first
        response = self.client.post("/login", json={"username": "admin", "password": "admin123"})
        if response.status_code == 200:
            self.token = response.json().get("token")

    @task(4)
    def read_heavy_operation(self):
        if not self.token:
            return
            
        # Simulate high-frequency reads (reading logs or gates)
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.get(f"/api/logs/peopleNeat", headers=headers, name="/api/logs/peopleNeat")

    @task(1)
    def write_heavy_operation(self):
        if not self.token:
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        action = random.choice(["/api/logs/entry", "/api/logs/exit"])
        
        if action == "/api/logs/entry":
            payload = {
                "person_id": random.randint(1, 100),
                "gate_id": random.randint(1, 3) # Only gates 1, 2, 3 exist
            }
        else:
            payload = {
                "log_id": random.randint(1, 50000) # Exit expects log_id
            }
            
        self.client.post(action, json=payload, headers=headers)
