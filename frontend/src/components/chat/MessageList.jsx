import { useState } from "react";
import useScrollToBottom from "../../hooks/useScrollToBottom";
import { MessageBubble } from "./MessageBubble";
import { PinnedMessageBanner } from "./PinnedMessageBanner";
import { NoConversationPlaceholder } from "./NoConversationPlaceholder";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useChatStore } from "../../store/useChatStore";

export function MessageList() {
  const { activeConversation, activeConversationId } = useSelectedConversation();
  const editMessage = useChatStore((state) => state.editMessage);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const pinMessage = useChatStore((state) => state.pinMessage);
  const unpinMessage = useChatStore((state) => state.unpinMessage);

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const lastMessageId = activeConversation?.messages.at(-1)?.id;
  const messagesScrollRef = useScrollToBottom(activeConversationId, lastMessageId);

  const pinnedMessage = activeConversation?.messages.find((m) => m.isPinned) ?? null;

  function scrollToPinned() {
    if (!pinnedMessage) return;
    const el = document.querySelector(`[data-message-id="${pinnedMessage.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(pinnedMessage.id);
      setTimeout(() => setHighlightedMessageId(null), 1500);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {activeConversation ? (
        <>
          <PinnedMessageBanner
            message={pinnedMessage}
            onJump={scrollToPinned}
            onUnpin={() => unpinMessage(pinnedMessage.id)}
          />

          <div
            ref={messagesScrollRef}
            className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3 sm:py-4"
          >
            <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
              Today
            </p>
            {activeConversation.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onEdit={editMessage}
                onDelete={deleteMessage}
                onPin={pinMessage}
                onUnpin={unpinMessage}
                highlighted={message.id === highlightedMessageId}
              />
            ))}
          </div>
        </>
      ) : (
        <NoConversationPlaceholder />
      )}
    </div>
  );
}
