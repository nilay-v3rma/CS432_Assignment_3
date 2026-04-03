"use client";
import React, { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "", email: "", role: "user" });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: "", email: "", role: "user", password: "" });

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users");
      setUsers(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/users", formData);
      setShowAddModal(false);
      setFormData({ username: "", password: "", email: "", role: "user" });
      fetchUsers();
    } catch (err) {
      console.error("Failed to add user", err);
      alert("Failed to add user");
    }
  };

  const handleEditClick = (u: any) => {
    setEditFormData({
      id: u.person_id || u.id,
      email: u.email || "",
      role: u.role || "user",
      password: ""
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { role: editFormData.role };
      if (editFormData.email.trim() !== "") payload.email = editFormData.email;
      if (editFormData.password.trim() !== "") payload.password = editFormData.password;
      
      await api.put(`/api/users/${editFormData.id}`, payload);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update user", err);
      alert("Failed to update user");
    }
  };

  const handleDeleteUser = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
      alert("Failed to delete user");
    }
  };

  const handleRowClick = (u: any) => {
    setSelectedUser(u);
    setShowViewModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Add User
        </button>
      </div>
      
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Username *</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required 
                  className="mt-1 block w-full rounded p-2 bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Password *</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required 
                  minLength={6}
                  className="mt-1 block w-full rounded p-2 bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 block w-full rounded p-2 bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Role *</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="mt-1 block w-full rounded p-2 bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input 
                  type="email" 
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="mt-1 block w-full rounded p-2 bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Role *</label>
                <select 
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  className="mt-1 block w-full rounded p-2 bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">New Password (Optional)</label>
                <input 
                  type="password" 
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                  minLength={6}
                  className="mt-1 block w-full rounded p-2 bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">User Details</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-medium text-gray-400">ID</span>
                <span className="text-lg text-white">{selectedUser.person_id || selectedUser.id}</span>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-400">Username</span>
                <span className="text-lg text-white">{selectedUser.username}</span>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-400">Email</span>
                <span className="text-lg text-white">{selectedUser.email || "N/A"}</span>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-400">Role</span>
                <span className="text-lg text-white capitalize">{selectedUser.role}</span>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-400">Created At</span>
                <span className="text-lg text-white">
                  {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : "N/A"}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl shadow overflow-hidden overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-700 text-gray-300">
              <th className="p-4 border-b font-medium">ID</th>
              <th className="p-4 border-b font-medium">Username</th>
              <th className="p-4 border-b font-medium">Email</th>
              <th className="p-4 border-b font-medium">Role</th>
              <th className="p-4 border-b font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map((u) => (
              <tr key={u.person_id || u.id} className="hover:bg-gray-900 cursor-pointer" onClick={() => handleRowClick(u)}>
                <td className="p-4 border-b">{u.person_id || u.id}</td>
                <td className="p-4 border-b">{u.username}</td>
                <td className="p-4 border-b">{u.email || "N/A"}</td>
                <td className="p-4 border-b capitalize">{u.role}</td>
                <td className="p-4 border-b flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEditClick(u); }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.person_id || u.id); }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}