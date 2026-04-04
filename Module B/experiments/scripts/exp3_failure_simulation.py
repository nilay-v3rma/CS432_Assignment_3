from locust import HttpUser, task, between

class FailureSimulationUser(HttpUser):
    wait_time = between(0.5, 1.0)

    @task
    def execute_failing_transaction(self):
        # Simulate failures during transactions to verify rollback
        # We assume the endpoint accepts a query param to intentionally trigger an error
        payload = {
            "amount": 100,
            "target": "account_b"
        }
        
        with self.client.post(
            "/api/transaction?inject_failure=true", 
            json=payload, 
            catch_response=True
        ) as response:
            # We expect the server to fail and rollback, returning an error code
            if response.status_code >= 400:
                response.success()
            else:
                response.failure(f"Transaction should have failed but got {response.status_code}")
