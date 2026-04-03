"use client";
import React, { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function MyPassPage() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  const fetchToken = useCallback(async () => {
    try {
      const res = await api.get("/api/qr/generate");
      setToken(res.data.qr_info);
      setTimeLeft(60);
    } catch (error) {
      console.error("Failed to fetch QR token", error);
      // Fallback or error state could be handled here
    }
  }, []);

  useEffect(() => {
    fetchToken();
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchToken]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold mb-2">My Access Pass</h1>
      <p className="text-gray-400 mb-8">Scan this at the gate for entry/exit.</p>

      <div className="p-4 bg-gray-800 border-4 border-blue-500 rounded-xl mb-6 shadow-sm">
        {token ? (
          <QRCodeSVG value={token} size={250} level="H" />
        ) : (
          <div className="w-[250px] h-[250px] flex items-center justify-center bg-gray-700">
            Scanning...
          </div>
        )}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-linear" 
          style={{ width: `${(timeLeft / 60) * 100}%` }}
        ></div>
      </div>
      <p className="text-sm font-medium text-gray-600">
        Refreshes in {timeLeft}s
      </p>
    </div>
  );
}
