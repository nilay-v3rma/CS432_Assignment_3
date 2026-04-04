from locust import HttpUser, task, between
import random

class ConcurrentUpdatesUser(HttpUser):
    wait_time = between(0.1, 0.5)
    token = None

    def on_start(self):
        # Authenticate and get a token before starting tasks
        response = self.client.post("/login", json={"username": "admin", "password": "admin123"})
        if response.status_code == 200:
            self.token = response.json().get("token")

    @task
    def update_resource(self):
        if not self.token:
            return
            
        # Simulate multiple users updating the exact same gate concurrently
        # Goal: Test isolation and consistency on a specific row
        gate_id = 1
        payload = {
            "name": f"Gate {gate_id}",
            "location": "Main Entrance",
            "status": random.choice(["open", "closed"]),
            "guards_assigned": random.randint(1, 5)
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        with self.client.put(
            f"/api/gates/{gate_id}", 
            json=payload,
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code in [200, 409]:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")
