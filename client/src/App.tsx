import { RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/sonner";
import { router } from "@/routes";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </GoogleOAuthProvider>
  );
}

export default App;

