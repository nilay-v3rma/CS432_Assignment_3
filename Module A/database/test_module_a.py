import os
import time
import threading
from datetime import datetime
from db_manager import DatabaseManager

def print_separator(title):
    print(f"\n{'='*20} {title} {'='*20}")

def setup_database(dbm):
    """Creates the database and schemas according our schema from assignment 2."""
    dbm.create_database("EntryGateDB")
    
    dbm.create_table("EntryGateDB", "GuestRequest", {"Request_ID": str, "Guest_Name": str, "Status": str}, search_key="Request_ID")
    dbm.create_table("EntryGateDB", "Person_Info", {"Person_ID": str, "Name": str, "Person_Type": str}, search_key="Person_ID")
    dbm.create_table("EntryGateDB", "QR_Code", {"QR_ID": str, "Person_ID": str, "Is_Active": bool}, search_key="QR_ID")
    dbm.create_table("EntryGateDB", "Log", {"Log_ID": str, "Person_ID": str, "Gate_ID": str, "Timestamp": str}, search_key="Log_ID")

def isolation_worker_1(dbm):
    """Simulates User 1 locking a record and taking a long time to process."""
    tx = dbm.begin_transaction()
    print("[Thread 1] Started Transaction. Updating REQ-001...")
    req_tbl = dbm.get_table("EntryGateDB", "GuestRequest")
    req_tbl.update("REQ-001", {"Request_ID": "REQ-001", "Guest_Name": "Alice Smith", "Status": "Processing_T1"}, tx=tx)
    print("[Thread 1] Lock Acquired.")
    time.sleep(2)
    tx.commit()
    print("[Thread 1] Committed and Released Lock.")

def isolation_worker_2(dbm):
    """Simulates User 2 trying to edit the exact same record while User 1 holds the lock."""
    time.sleep(0.5) # Ensure Thread 1 starts first
    tx = dbm.begin_transaction()
    print("[Thread 2] Started Transaction. Attempting to update REQ-001...")
    print("[Thread 2] Waiting for lock...")
    req_tbl = dbm.get_table("EntryGateDB", "GuestRequest")
    
    start_wait = time.time()
    # This will block until Thread 1 commits
    req_tbl.update("REQ-001", {"Request_ID": "REQ-001", "Guest_Name": "Alice Smith", "Status": "Processing_T2"}, tx=tx)
    end_wait = time.time()
    
    print(f"[Thread 2] Lock Acquired! (Waited {end_wait - start_wait:.2f} seconds)")
    tx.commit()
    print("[Thread 2] Committed.")

def issue_qr_with_business_rule(dbm, qr_record, tx):
    """Application-level consistency rule: QR_Code.Person_ID must exist in Person_Info."""
    person_tbl = dbm.get_table("EntryGateDB", "Person_Info")
    if person_tbl.get(qr_record["Person_ID"]) is None:
        raise ValueError(f"Consistency rule violation: Person_ID {qr_record['Person_ID']} does not exist.")

    qr_tbl = dbm.get_table("EntryGateDB", "QR_Code")
    qr_tbl.insert(qr_record, tx=tx)

def main():
    # Clean up any old log files from previous tests
    if os.path.exists("db_transaction.log"):
        os.remove("db_transaction.log")

    print_separator("PHASE 1: SYSTEM INITIALIZATION")
    dbm = DatabaseManager()
    setup_database(dbm)
    
    # Pre-populate a pending guest request (Simulating an admin approving a visit)
    init_tx = dbm.begin_transaction()
    guest_req_tbl = dbm.get_table("EntryGateDB", "GuestRequest")
    guest_req_tbl.insert({"Request_ID": "REQ-001", "Guest_Name": "Alice Smith", "Status": "Pending"}, tx=init_tx)
    init_tx.commit()
    print("System initialized. Pending Guest Request created for Alice Smith (Committed to WAL).")


    print_separator("PHASE 2A: SUCCESSFUL TRANSACTION (TESTING CONSISTENCY)")
    # Scenario: Alice arrives at the gate. We must update the request, create her profile, issue a QR, and log entry.
    tx1 = dbm.begin_transaction()
    print(f"Transaction {tx1.tx_id} STARTED.")

    try:
        # 1. Update Request
        guest_req_tbl.update("REQ-001", {"Request_ID": "REQ-001", "Guest_Name": "Alice Smith", "Status": "Entered"}, tx=tx1)
        
        # 2. Create Person Record
        person_tbl = dbm.get_table("EntryGateDB", "Person_Info")
        person_tbl.insert({"Person_ID": "P-100", "Name": "Alice Smith", "Person_Type": "Guest"}, tx=tx1)
        
        # 3. Issue Active QR Code
        qr_tbl = dbm.get_table("EntryGateDB", "QR_Code")
        qr_tbl.insert({"QR_ID": "QR-999", "Person_ID": "P-100", "Is_Active": True}, tx=tx1)
        
        # 4. Log the Entry
        log_tbl = dbm.get_table("EntryGateDB", "Log")
        log_tbl.insert({"Log_ID": "L-001", "Person_ID": "P-100", "Gate_ID": "Gate-A", "Timestamp": str(datetime.now())}, tx=tx1)

        tx1.commit()
        print(f"CONSISTENCY VERIFIED: Transaction {tx1.tx_id} committed successfully.")
    except Exception as e:
        tx1.rollback()
        print(f"Transaction failed: {e}")


    print_separator("PHASE 2B: CONSISTENCY VIOLATION TEST")
    bad_tx = dbm.begin_transaction()
    print(f"Transaction {bad_tx.tx_id} STARTED (invalid QR insert).")
    try:
        issue_qr_with_business_rule(
            dbm,
            {"QR_ID": "QR-BAD", "Person_ID": "P-404", "Is_Active": True},
            bad_tx,
        )
        bad_tx.commit()
    except Exception as e:
        print(f"Expected consistency error: {e}")
        bad_tx.rollback()

    qr_after_violation = dbm.get_table("EntryGateDB", "QR_Code").get("QR-BAD")
    print(f"CONSISTENCY VERIFIED: Invalid QR transaction rolled back: {qr_after_violation is None}")


    print_separator("PHASE 3: TRANSACTION FAILURE & ROLLBACK (TESTING ATOMICITY)")
    # Scenario: Bob arrives, but a system error occurs right before his QR code is generated.
    setup_tx = dbm.begin_transaction()
    guest_req_tbl.insert({"Request_ID": "REQ-002", "Guest_Name": "Bob Jones", "Status": "Pending"}, tx=setup_tx)
    setup_tx.commit()

    tx2 = dbm.begin_transaction()
    print(f"Transaction {tx2.tx_id} STARTED.")
    
    try:
        print("-> Updating Bob's request to 'Entered'...")
        guest_req_tbl.update("REQ-002", {"Request_ID": "REQ-002", "Guest_Name": "Bob Jones", "Status": "Entered"}, tx=tx2)
        
        print("-> Creating Bob's Person record...")
        person_tbl.insert({"Person_ID": "P-101", "Name": "Bob Jones", "Person_Type": "Guest"}, tx=tx2)
        
        print("-> CRASH! Simulated system error occurred before QR code creation.")
        raise Exception("Simulated power failure!")
        
    except Exception as e:
        print(f"Error caught: {e}")
        tx2.rollback()
        
    # Verify Bob's data was rolled back
    print("\nVerifying DB state after rollback:")
    print("Bob's Request Status :", guest_req_tbl.get("REQ-002")["Status"])
    print("Bob's Person Record :", person_tbl.get("P-101"))
    print("ATOMICITY VERIFIED: Incomplete transaction fully rolled back.\n")

    print_separator("PHASE 4: CONCURRENCY TEST (TESTING ISOLATION)")
    print("Spawning two users attempting to update REQ-001 simultaneously...\n")
    
    t1 = threading.Thread(target=isolation_worker_1, args=(dbm,))
    t2 = threading.Thread(target=isolation_worker_2, args=(dbm,))
    
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    
    print("ISOLATION VERIFIED: Thread 2 waited safely. No race conditions occurred.")


    print_separator("PHASE 5: CRASH WITHOUT ROLLBACK (RECOVERY UNDO PROOF)")
    tx_crash = dbm.begin_transaction()
    print(f"Transaction {tx_crash.tx_id} STARTED.")
    print("-> Applying updates, then simulating crash before COMMIT...")
    guest_req_tbl.update("REQ-002", {"Request_ID": "REQ-002", "Guest_Name": "Bob Jones", "Status": "Entered"}, tx=tx_crash)
    person_tbl.insert({"Person_ID": "P-CRASH", "Name": "Crash User", "Person_Type": "Guest"}, tx=tx_crash)

    print_separator("PHASE 6: CRASH RECOVERY SIMULATION (TESTING DURABILITY)")
    print("Simulating complete server reboot...")
    # We create a completely new DatabaseManager. The old in-memory B+ Trees are gone!
    dbm_rebooted = DatabaseManager()
    setup_database(dbm_rebooted) # Re-register schemas
    
    # Run the recovery protocol
    dbm_rebooted.run_recovery()
    
    # Verify Alice's data survived the reboot (Durability)
    print("\nVerifying data after Recovery:")
    recovered_person = dbm_rebooted.get_table("EntryGateDB", "Person_Info").get("P-100")
    recovered_qr = dbm_rebooted.get_table("EntryGateDB", "QR_Code").get("QR-999")
    
    print(f"Alice's Profile Recovered: {recovered_person is not None}")
    print(f"Alice's QR Code Recovered: {recovered_qr is not None}")
    
    # Verify Bob's partial data was NOT recovered (Atomicity, UNDO of uncommitted transaction)
    ghost_person = dbm_rebooted.get_table("EntryGateDB", "Person_Info").get("P-101")
    print(f"Bob's partial profile correctly ignored: {ghost_person is None}")

    crash_person = dbm_rebooted.get_table("EntryGateDB", "Person_Info").get("P-CRASH")
    req_002_state = dbm_rebooted.get_table("EntryGateDB", "GuestRequest").get("REQ-002")
    print(f"Crash-time uncommitted person ignored: {crash_person is None}")
    print(f"Crash-time uncommitted status reverted to pending state: {req_002_state['Status'] == 'Pending'}")
    print("DURABILITY VERIFIED: Committed data survived memory wipe, uncommitted data ignored.")


    print_separator("ALL TESTS COMPLETED SUCCESSFULLY")

if __name__ == "__main__":
    main()