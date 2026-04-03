"use client";
import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    reason: "",
    exit_date: "",
    email: "",
    age: "",
    vehicle_number: ""
  });
  const { user } = useAuth();

  const fetchRequests = async () => {
    if (!user?.person_id) return;
    try {
      const res = await api.get(`/api/guest-requests/member/${user.person_id}`);
      setRequests(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.person_id) return;

    try {
      await api.post('/api/guest-requests', {
        ...formData,
        person_id: user.person_id,
        age: formData.age ? parseInt(formData.age) : undefined
      });
      setIsModalOpen(false);
      setFormData({
        name: "",
        contact: "",
        reason: "",
        exit_date: "",
        email: "",
        age: "",
        vehicle_number: ""
      });
      fetchRequests();
    } catch (err: any) {
      console.error("Failed to submit request", err);
      alert(err.response?.data?.message || "Failed to submit request. Please check the date format (YYYY-MM-DD) and try again.");
    }
  };

  const handleDeleteRequest = async () => {
    if (!selectedRequest || !user?.person_id) return;
    if (!confirm("Are you sure you want to delete this pending request?")) return;

    try {
      await api.delete(`/api/guest-requests/member/${selectedRequest.guest_request_id || selectedRequest.id}?person_id=${user.person_id}`);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      console.error("Failed to delete request", err);
      alert("Failed to delete the request. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Guest Requests</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Request
        </button>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-white">Create New Guest Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1 text-sm">Guest Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Contact (Phone) *</label>
                  <input required type="text" name="contact" value={formData.contact} onChange={handleInputChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Exit Date (YYYY-MM-DD) *</label>
                  <input required type="text" name="exit_date" pattern="\d{4}-\d{2}-\d{2}" placeholder="YYYY-MM-DD" value={formData.exit_date} onChange={handleInputChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-1 text-sm">Reason for Visit *</label>
                <textarea required name="reason" value={formData.reason} onChange={handleInputChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white h-20"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Email *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Age (Optional)</label>
                  <input type="number" name="age" min="0" max="120" value={formData.age} onChange={handleInputChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-1 text-sm">Vehicle Number (Optional)</label>
                <input type="text" name="vehicle_number" value={formData.vehicle_number} onChange={handleInputChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg relative border border-gray-700">
            <button 
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedRequest.name}</h2>
                <p className="text-sm text-gray-400 mt-1">Guest Request Details</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                selectedRequest.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' :
                selectedRequest.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedRequest.status || 'Pending'}
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-900 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Contact</p>
                  <p className="text-white">{selectedRequest.contact || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
                  <p className="text-white">{selectedRequest.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Age</p>
                  <p className="text-white">{selectedRequest.age || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Vehicle No.</p>
                  <p className="text-white">{selectedRequest.vehicle_number || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Reason for Visit</p>
                <p className="text-white whitespace-pre-wrap">{selectedRequest.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-900 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Created Date</p>
                  <p className="text-white">{selectedRequest.date || selectedRequest.created_at || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Exit Date</p>
                  <p className="text-white">{selectedRequest.exit_date || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              {selectedRequest.status?.toLowerCase() === 'pending' && (
                <button
                  onClick={handleDeleteRequest}
                  className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Request
                </button>
              )}
              <button 
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl shadow overflow-hidden overflow-x-auto">
        {requests.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-700 text-gray-300">
                <th className="p-4 border-b font-medium">Guest Name</th>
                <th className="p-4 border-b font-medium">Date</th>
                <th className="p-4 border-b font-medium">Exit Date</th>
                <th className="p-4 border-b font-medium">Reason</th>
                <th className="p-4 border-b font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr 
                  key={r.id || r.guest_request_id} 
                  className="hover:bg-gray-900 border-b last:border-b-0 cursor-pointer"
                  onClick={() => setSelectedRequest(r)}
                >
                  <td className="p-4">{r.name}</td>
                  <td className="p-4">{r.date || r.created_at || 'N/A'}</td>
                  <td className="p-4">{r.exit_date || 'N/A'}</td>
                  <td className="p-4">{r.reason}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                      r.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' :
                      r.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {r.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <p>No active requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
}