"use client";
import React, { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "@/lib/api";

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const isProcessingRef = useRef(false);

  useEffect(() => {
    console.log("Initializing QR code scanner...");
    
    // We add rememberLastUsedCamera: true to make it automatically use the back camera
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );
    
    scanner.render(
      async (decodedText) => {
        // Prevent duplicate processing while an API call is in flight
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        console.log("🔥 QR Code detected:", decodedText);
        setScanResult(decodedText);
        
        try {
          // Fix: Wrap the URL as just '/api/logs/scan' (interceptors handle http://localhost:3000)
          const response = await api.post("/api/logs/scan", { qr_info: decodedText, gate_id: 1 });
          
          setStatus("success");
          setMessage(response.data.message || "Access Granted");
        } catch (error: any) {
          setStatus("error");
          setMessage(error.response?.data?.message || "Access Denied: Invalid or Expired Token");
        }

        // Keep the result on screen for a few seconds, then allow a new scan
        setTimeout(() => {
          setScanResult(null);
          setStatus("idle");
          isProcessingRef.current = false;
        }, 4000);
      },
      (error) => {
        // We comment this out to reduce noisy logs, but internally it throws on every 10ms frame that doesn't have a QR. 
        // This is perfectly normal behavior for this library.
      }
    );

    return () => {
      // Catch prevents unmounted react errors
      scanner.clear().catch((error) => console.log("Cleanup unmount warning intentionally swallowed."));
    };
  }, []);

  return (
    <div className="max-w-lg mx-auto mt-10 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-gray-200">Scanner</h1>
      
      {status === "success" && (
        <div className="mb-4 w-full p-4 bg-green-100 text-green-800 rounded-lg text-center font-semibold">
          {message}
        </div>
      )}
      
      {status === "error" && (
        <div className="mb-4 w-full p-4 bg-red-100 text-red-800 rounded-lg text-center font-semibold">
          {message}
        </div>
      )}

      <div className="w-full bg-gray-800 p-4 rounded-xl shadow-md">
        <div id="reader" className="w-full aspect-square md:aspect-video rounded-lg overflow-hidden"></div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Mobile optimized: Point the camera directly at the user&apos;s QR code.
        </p>
      </div>
    </div>
  );
}
