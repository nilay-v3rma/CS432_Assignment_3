"use client";
import React, { useState } from "react";
import api from "@/lib/api";

export default function ManualEntry() {
  const [personId, setPersonId] = useState("");
  const [gateId, setGateId] = useState("1");
  const [action, setAction] = useState("entry");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    
    try {
      if (action === "entry") {
        await api.post("/api/logs/entry", { person_id: personId, gate_id: gateId });
      } else {
        // Technically exit wants log_id, but mapping person_id via fallback structure if supported
        await api.post("/api/logs/exit", { log_id: personId });
      }
      setStatus("Successfully logged " + action);
      setPersonId("");
    } catch (err: any) {
      setStatus("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Manual Entry Logging</h1>
      <div className="bg-gray-800 p-6 rounded-xl shadow max-w-md">
        
        {status && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-center ${status.startsWith("Error") ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {status}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Person / Log ID</label>
            <input 
              type="text" 
              required
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full border border-gray-300 rounded p-2" 
              placeholder="Enter ID..." 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Gate ID</label>
            <select 
              className="w-full border border-gray-300 rounded p-2"
              value={gateId}
              onChange={(e) => setGateId(e.target.value)}
            >
              <option value="1">Gate 1</option>
              <option value="2">Gate 2</option>
              <option value="3">Gate 3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Action</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="action" checked={action === "entry"} onChange={() => setAction("entry")} /> Entry
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="action" checked={action === "exit"} onChange={() => setAction("exit")} /> Exit
              </label>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded mt-4 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging..." : "Log Action"}
          </button>
        </form>
      </div>
    </div>
  );
}