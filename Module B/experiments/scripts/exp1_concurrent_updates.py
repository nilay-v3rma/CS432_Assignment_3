from locust import HttpUser, task, between
import random

class ConcurrentUpdatesUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task
    def update_resource(self):
        # Simulate multiple users updating the exact same resource concurrently
        # Goal: Test isolation and consistency
        resource_id = 1
        payload = {
            "status": "active",
            "actor_id": random.randint(1, 10000)
        }
        
        with self.client.put(
            f"/api/resource/{resource_id}", 
            json=payload, 
            catch_response=True
        ) as response:
            if response.status_code in [200, 409]:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")
