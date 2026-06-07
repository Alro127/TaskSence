import { RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/sonner";
import { router } from "@/routes";
import { GuidanceProvider } from "@/features/guidance/context/GuidanceContext";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

console.log("[System] TaskSense App Loading - Version: " + new Date().toISOString());

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <GuidanceProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </GuidanceProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

