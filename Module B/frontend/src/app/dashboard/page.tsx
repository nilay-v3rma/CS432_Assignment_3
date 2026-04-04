"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
      <div className="bg-gray-800 p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Welcome back, {user?.username}!</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h3 className="font-bold text-blue-800">Your Role</h3>
            <p className="text-blue-600 capitalize">{user?.role}</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
            <h3 className="font-bold text-green-800">Status</h3>
            <p className="text-green-600">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}