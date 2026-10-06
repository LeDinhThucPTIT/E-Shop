import { Sparkles, X } from "lucide-react";
import { useUIStore } from "../../stores/useUIStore";
import AIChatPanel from "./AIChatPanel";

export default function AIFloatingButton() {
  const { isAIDrawerOpen, setAIDrawerOpen } = useUIStore();

  return (
    <>
      <button
        onClick={() => setAIDrawerOpen(!isAIDrawerOpen)}
        aria-label={isAIDrawerOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
      >
        {isAIDrawerOpen ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      {isAIDrawerOpen && (
        <div className="fixed bottom-24 right-5 z-40 h-[min(600px,75vh)] w-[min(400px,calc(100vw-2.5rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg animate-slideUp sm:right-6">
          <AIChatPanel compact onClose={() => setAIDrawerOpen(false)} />
        </div>
      )}
    </>
  );
}
