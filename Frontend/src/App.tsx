import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/router";
import { useAuthStore } from "./stores/useAuthStore";
import { useCatalogStore } from "./stores/useCatalogStore";
export default function App() {
  useEffect(() => {
    void useAuthStore.getState().refresh();
    void useCatalogStore.getState().load();
  }, []);
  return <RouterProvider router={router} />;
}
