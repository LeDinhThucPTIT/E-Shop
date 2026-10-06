import { Sparkles } from "lucide-react";
import Container from "../../components/ui/Container";
import AIChatPanel from "../../components/ai/AIChatPanel";

export default function AIAssistantPage() {
  return (
    <Container className="py-8">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500 text-white">
          <Sparkles size={18} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink-900">Trợ lý mua sắm AI</h1>
          <p className="text-sm text-slate-500">Hỏi bất cứ điều gì về sản phẩm, ngân sách hoặc nhu cầu sử dụng</p>
        </div>
      </div>
      <div className="h-[70vh] min-h-[500px] overflow-hidden rounded-lg border border-slate-200 shadow-sm">
        <AIChatPanel />
      </div>
    </Container>
  );
}
