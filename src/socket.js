import { io } from "socket.io-client";

// The URL for your backend Socket.IO server
// In development, Vite will proxy /socket.io to this target
const URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export const socket = io(URL, {
  withCredentials: true,
  autoConnect: true,
  path: "/socket.io", // Ensure this matches the proxy path in vite.config.js
});

// Optional: Add some logging for debugging
socket.on("connect", () => {
  console.log("Global Socket.IO connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Global Socket.IO disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("Global Socket.IO connection error:", err.message);
});
