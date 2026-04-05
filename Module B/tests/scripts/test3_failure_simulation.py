from locust import HttpUser, task, between

class FailureSimulationUser(HttpUser):
    wait_time = between(0.5, 1.0)
    token = None

    def on_start(self):
        # Authenticate first
        response = self.client.post("/login", json={"username": "admin", "password": "admin123"})
        if response.status_code == 200:
            self.token = response.json().get("token")

    @task
    def failing_guest_request(self):
        if not self.token:
            return
            
        # Simulate failures during transactions to verify rollback
        # Providing invalid parameters like negative capacity constraints, missing vital fields to trigger constraint errors
        # Assuming the create guest request fails halfway
        payload = {
            # Invalid fields to induce an error during the request
            "person_id": None,
            "purpose": "Simulating Failure",
            "host_id": "invalid_host"
        }
        headers = {"Authorization": f"Bearer {self.token}"}
        
        with self.client.post(
            "/api/guest-requests", 
            json=payload, 
            headers=headers,
            catch_response=True
        ) as response:
            # We expect the server to fail and rollback, returning an error code
            if response.status_code >= 400:
                response.success()
            else:
                response.failure(f"Transaction should have failed but got {response.status_code}")

    @task
    def failing_gate_update(self):
        if not self.token:
            return
            
        # Attempt to update a non-existent gate with invalid negative guards assigned
        payload = {
            "name": "",
            "guards_assigned": -5 
        }
        headers = {"Authorization": f"Bearer {self.token}"}
        
        with self.client.put(
            "/api/gates/99999", 
            json=payload, 
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code >= 400:
                response.success()
            else:
                response.failure(f"Gate update should have failed but got {response.status_code}")

    @task
    def failing_blacklist_add(self):
        if not self.token:
            return
            
        # Attempt to add to blacklist with non-integer person_id and missing reason
        payload = {
            "person_id": "invalid_person_id"
        }
        headers = {"Authorization": f"Bearer {self.token}"}
        
        with self.client.post(
            "/api/blacklist", 
            json=payload, 
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code >= 400:
                response.success()
            else:
                response.failure(f"Blacklist addition should have failed but got {response.status_code}")
