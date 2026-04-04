"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Hide sidebar completely on the login page
  if (pathname === '/login') return null;

  return (
    <>
      <div className="md:hidden flex items-center justify-between bg-gray-900 w-full p-4 fixed top-0 z-50">
        <div className="text-xl font-bold text-blue-400">GateGuard</div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-blue-400 focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col z-50`}>
        <div className="text-2xl font-bold mb-8 text-blue-400 hidden md:block">GateGuard</div>
        <nav className="flex-1 space-y-2 overflow-y-auto mt-12 md:mt-0">
          <Link href="/" className="block py-2 px-4 rounded hover:bg-gray-800" onClick={() => setIsOpen(false)}>Public Dashboard</Link>
          
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="block py-2 px-4 rounded hover:bg-gray-800" onClick={() => setIsOpen(false)}>My Dashboard</Link>
              <Link href="/my-pass" className="block py-2 px-4 rounded hover:bg-gray-800" onClick={() => setIsOpen(false)}>My Pass (QR)</Link>
              
              {/* Show requests for non-guard/admin users technically, but keeping it broad here */}
              {user?.role?.toLowerCase() !== 'guard' && (
                <Link href="/requests" className="block py-2 px-4 rounded hover:bg-gray-800" onClick={() => setIsOpen(false)}>Requests</Link>
              )}

              {/* Guard and Admin specific routes */}
              {(user?.role?.toLowerCase() === 'guard' || user?.role?.toLowerCase() === 'admin') && (
                <div className="pt-4 mt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Security Operations</p>
                  <Link href="/scan" className="block py-2 px-4 rounded hover:bg-gray-800" onClick={() => setIsOpen(false)}>Scan QR Code</Link>
                  <Link href="/manual-entry" className="block py-2 px-4 rounded hover:bg-gray-800" onClick={() => setIsOpen(false)}>Manual Entry</Link>
                </div>
              )}

              {/* Strictly Admin specific routes */}
              {user?.role?.toLowerCase() === 'admin' && (
                <div className="pt-4 mt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Administration</p>
                  <Link href="/admin/users" className="block py-2 px-4 rounded hover:bg-gray-800" onClick={() => setIsOpen(false)}>Manage Users</Link>
                  <Link href="/admin/gates" className="block py-2 px-4 rounded hover:bg-gray-800" onClick={() => setIsOpen(false)}>Manage Gates</Link>
                  <Link href="/admin/approvals" className="block py-2 px-4 rounded hover:bg-gray-800" onClick={() => setIsOpen(false)}>Pending Approvals</Link>
                  <Link href="/admin/blacklist" className="block py-2 px-4 rounded hover:bg-gray-800" onClick={() => setIsOpen(false)}>Blacklist</Link>
                </div>
              )}
              
              <div className="pt-8 mt-auto">
                <div className="mb-4 text-xs text-gray-400">
                  Logged in as: <br />
                  <span className="text-white font-medium">{user?.username} ({user?.role})</span>
                </div>
                <button 
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="w-full text-left block py-2 px-4 rounded bg-red-600 hover:bg-red-700 text-white transition-opacity"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-8 mt-auto">
               <Link href="/login" className="block py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 text-center text-white" onClick={() => setIsOpen(false)}>Sign in</Link>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}