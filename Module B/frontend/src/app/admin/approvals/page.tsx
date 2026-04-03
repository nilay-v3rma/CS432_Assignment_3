"use client";
import React, { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminApprovals() {
  const [requests, setRequests] = useState<any[]>([]);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/api/guest-requests/pending");
      const data = res.data.data || res.data || [];
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch pending requests", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      if (action === "approve") {
        await api.patch(`/api/guest-requests/${id}/approve`);
      } else {
        await api.patch(`/api/guest-requests/${id}/reject`);
      }
      fetchRequests(); // Refresh the list
    } catch (err) {
      console.error(`Failed to ${action} request`, err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Pending Approvals</h1>
      <div className="bg-gray-800 rounded-xl shadow overflow-hidden overflow-x-auto">
        {requests.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-700 text-gray-300">
                <th className="p-4 border-b font-medium">Guest Name</th>
                <th className="p-4 border-b font-medium">Contact</th>
                <th className="p-4 border-b font-medium">Email</th>
                <th className="p-4 border-b font-medium">Reason</th>
                <th className="p-4 border-b font-medium">Requested By</th>
                <th className="p-4 border-b font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.guest_request_id} className="hover:bg-gray-900 border-b last:border-b-0">
                  <td className="p-4">{r.name}</td>
                  <td className="p-4">{r.contact}</td>
                  <td className="p-4">{r.email || "N/A"}</td>
                  <td className="p-4">{r.reason}</td>
                  <td className="p-4">{r.member_id}</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button 
                      onClick={() => handleAction(r.guest_request_id, "approve")}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleAction(r.guest_request_id, "reject")}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <p>No pending guest requests requiring approval.</p>
          </div>
        )}
      </div>
    </div>
  );
}