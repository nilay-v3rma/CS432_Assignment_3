from locust import HttpUser, task, between

class RaceConditionUser(HttpUser):
    wait_time = between(0.1, 0.5)
    token = None

    def on_start(self):
        # Authenticate first
        response = self.client.post("/login", json={"username": "admin", "password": "admin123"})
        if response.status_code == 200:
            self.token = response.json().get("token")

    @task
    def critical_operation(self):
        if not self.token:
            return
            
        # Simulate many users attempting to approve the same guest request simultaneously
        # Goal: Ensure no incorrect states (e.g., double processing)
        request_id = 1
        headers = {"Authorization": f"Bearer {self.token}"}
        
        with self.client.patch(
            f"/api/guest-requests/{request_id}/approve", 
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success() # Successfully approved
            elif response.status_code in [400, 403, 404, 409]:
                response.success() # Expected denial (already approved/not found)
            else:
                response.failure(f"Unexpected status: {response.status_code}")
