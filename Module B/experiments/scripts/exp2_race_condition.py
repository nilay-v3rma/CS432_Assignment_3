from locust import HttpUser, task, between

class RaceConditionUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task
    def critical_operation(self):
        # Simulate many users attempting the exact same critical operation simultaneously
        # Goal: Ensure no incorrect results (e.g., overselling, double claiming)
        payload = {
            "action": "claim_limited_resource",
            "resource_id": 42
        }
        
        with self.client.post(
            "/api/critical-action", 
            json=payload, 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success() # Resource claimed successfully
            elif response.status_code in [400, 403, 409]:
                response.success() # Expected denial of claim (resource already taken)
            else:
                response.failure(f"Unexpected status: {response.status_code}")
