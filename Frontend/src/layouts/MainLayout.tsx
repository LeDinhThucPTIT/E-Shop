import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileDrawer from "../components/layout/MobileDrawer";
import AIFloatingButton from "../components/ai/AIFloatingButton";
import ToastContainer from "../components/common/ToastContainer";

export default function MainLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F1F4F9] text-ink-900">
      <Header />
      <MobileDrawer />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AIFloatingButton />
      <ToastContainer />
    </div>
  );
}
