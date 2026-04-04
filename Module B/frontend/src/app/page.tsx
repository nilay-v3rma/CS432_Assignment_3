"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PublicDashboard() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Fetch recent logs
    const fetchLogs = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/logs/peopleNeat");
        if (res.data && res.data.data) {
          setLogs(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
    };
    
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Public Campus Dashboard</h1>
      <div className="bg-gray-800 rounded-xl shadow overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-700 text-gray-300">
              <th className="p-4 border-b">ID</th>
              <th className="p-4 border-b">Person Name</th>
              <th className="p-4 border-b">Contact</th>
                  <th className="p-4 border-b">Gate</th>
                  <th className="p-4 border-b">Vehicle</th>
                  <th className="p-4 border-b">Type</th>
                  <th className="p-4 border-b">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? logs.map((log: any) => (
              <tr key={log.log_id} className="hover:bg-gray-900">
                <td className="p-4 border-b">{log.log_id}</td>
                <td className="p-4 border-b">{log.person_name || 'Unknown'}</td>
                <td className="p-4 border-b">{log.person_contact || 'N/A'}</td>
                <td className="p-4 border-b">{log.gate}</td>
                <td className="p-4 border-b">{log.vehicle || 'None'}</td>
                    <td className="p-4 border-b">{log.log_type || 'unknown'}</td>
                <td className="p-4 border-b">{new Date(log.time).toLocaleString()}</td>
              </tr>
            )) : (
              <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-400">No logs available (or missing Auth mapping)</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}