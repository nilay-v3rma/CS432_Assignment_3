"use client";
import React, { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminBlacklist() {
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'list' | 'manual'>('list');
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({ person_id: '', name: '', contact: '', expiry: '' });

  const fetchBlacklist = async () => {
    try {
      const res = await api.get("/api/blacklist");
      setBlacklist(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch blacklist", err);
    }
  };

  useEffect(() => {
    fetchBlacklist();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users?limit=100"); // Getting up to 100 users for selection
      setUsers(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: formData.name,
        expiry: formData.expiry
      };
      if (addMode === 'list' && formData.person_id) {
        payload.person_id = parseInt(formData.person_id);
      } else if (addMode === 'manual' && formData.contact) {
        payload.contact = formData.contact;
      }

      await api.post("/api/blacklist", payload);
      setFormData({ person_id: '', name: '', contact: '', expiry: '' });
      setIsAddModalOpen(false);
      fetchBlacklist();
    } catch (err: any) {
      console.error("Failed to add to blacklist", err);
      alert(err.response?.data?.message || "Failed to add to blacklist");
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm("Are you sure you want to remove this person from the blacklist?")) return;
    try {
      await api.delete(`/api/blacklist/${id}`);
      fetchBlacklist();
    } catch (err: any) {
      console.error("Failed to remove from blacklist", err);
      alert(err.response?.data?.message || "Failed to remove from blacklist");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blacklist Management</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Add to Blacklist
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-white pb-3 border-b border-gray-700">Add to Blacklist</h2>
            <div className="flex gap-6 mb-6">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input 
                  type="radio" 
                  name="addMode"
                  checked={addMode === 'list'} 
                  onChange={() => setAddMode('list')} 
                  className="accent-red-500 w-4 h-4"
                /> 
                Select User
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input 
                  type="radio" 
                  name="addMode"
                  checked={addMode === 'manual'} 
                  onChange={() => setAddMode('manual')} 
                  className="accent-red-500 w-4 h-4"
                /> 
                Manual Entry
              </label>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              {addMode === 'list' ? (
                <div>
                  <label className="block text-sm mb-1 text-gray-400">User</label>
                  <select 
                    className="w-full p-2.5 bg-gray-900 rounded border border-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-white"
                    value={formData.person_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      const user = users.find(u => (u.person_id || u.id).toString() === id);
                      setFormData({ ...formData, person_id: id, name: user?.username || '' });
                    }}
                    required
                  >
                    <option value="">Select a user...</option>
                    {users.map(u => (
                      <option key={u.person_id || u.id} value={u.person_id || u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm mb-1 text-gray-400">Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 bg-gray-900 rounded border border-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-white"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required 
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-400">Contact Info</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 bg-gray-900 rounded border border-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-white"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="Phone or Email"
                      required
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm mb-1 text-gray-400">Expiry Date</label>
                <input 
                  type="date" 
                  className="w-full p-2.5 bg-gray-900 rounded border border-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-white"
                  value={formData.expiry}
                  onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded font-medium transition-colors text-white"
                >
                  Confirm Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="bg-gray-800 rounded-xl shadow overflow-hidden overflow-x-auto border-t-4 border-red-500">
        {blacklist.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-700 text-gray-300">
                <th className="p-4 border-b font-medium">Name</th>
                <th className="p-4 border-b font-medium">Contact</th>
                <th className="p-4 border-b font-medium">Expiry</th>
                <th className="p-4 border-b font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blacklist.map((entry) => (
                <tr key={entry.blacklist_id || entry.id} className="hover:bg-red-50 border-b last:border-b-0">
                  <td className="p-4 font-semibold">{entry.name}</td>
                  <td className="p-4">{entry.contact}</td>
                  <td className="p-4">{entry.expiry || 'Permanent'}</td>
                  <td className="p-4 flex gap-2">
                    <button 
                      onClick={() => handleRemove(entry.blacklist_id || entry.id)}
                      className="text-sm text-gray-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <p>The blacklist is currently empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}