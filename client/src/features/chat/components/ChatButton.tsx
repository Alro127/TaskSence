import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { toggleChat } from "../chatSlice";

export function ChatButton() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.chat.isOpen);

  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
      onClick={() => dispatch(toggleChat())}
      title={isOpen ? "Close assistant" : "Open assistant"}
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <MessageCircle className="h-5 w-5" />
      )}
    </Button>
  );
}
