"use client";
import React, { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminGates() {
  const [gates, setGates] = useState<any[]>([]);

  const fetchGates = async () => {
    try {
      const res = await api.get("/api/gates");
      setGates(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch gates", err);
    }
  };

  useEffect(() => {
    fetchGates();
  }, []);

  const toggleGate = async (id: number, currentStatus: string) => {
    try {
      // Typically an API design either wants 'open' or 'close' implicitly. Let's use the mapping layout.
      const action = currentStatus.toLowerCase() === "closed" ? "open" : "close";
      await api.patch(`/api/gates/${id}/${action}`);
      fetchGates(); // Refresh status after toggle
    } catch (err: any) {
      console.error("Failed to toggle gate", err);
      alert(err.response?.data?.message || "Failed to toggle gate");
      // Fallback update if patch fails but you wanna pretend it works locally (uncomment if need optimistic UI):
      // setGates(gates.map(g => (g.gate_id || g.id) === id ? { ...g, status: currentStatus === "open" ? "closed" : "open" } : g));
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Manage Gates</h1>
      
      {gates.length === 0 ? (
        <div className="bg-gray-800 p-6 rounded-xl shadow text-center text-gray-400">
          No gates configured or error fetching gates.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gates.map((gate) => (
            <div key={gate.gate_id || gate.id} className="bg-gray-800 p-6 rounded-xl shadow text-center flex flex-col items-center">
              <h2 className="text-xl font-bold mb-2">{gate.name || `Gate ${gate.gate_id || gate.id}`}</h2>
              
              <div className={`inline-block px-4 py-1 rounded-full font-semibold mb-6 capitalize ${
                gate.status?.toLowerCase() === 'open' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {gate.status || "Unknown"}
              </div>
              
              <button 
                onClick={() => toggleGate(gate.gate_id || gate.id, gate.status || "closed")}
                className="w-full py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-200 transition font-medium border border-gray-300 shadow-sm"
              >
                {gate.status?.toLowerCase() === 'closed' ? 'Open Gate' : 'Close Gate'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}