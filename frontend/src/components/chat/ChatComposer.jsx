import { Button, TextArea } from "@heroui/react";
import { BanIcon, ImageIcon, LoaderIcon, SendHorizontalIcon } from "lucide-react";
import { useRef } from "react";
import useKeyboardSound from "../../hooks/useKeyboardSound";
import { useChatStore } from "../../store/useChatStore";
import { useBlockStore } from "../../store/useBlockStore";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import { AISuggestions } from "./AISuggestions";

function TypingIndicator({ name }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <div className="flex items-center gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-muted">{name} is typing...</span>
    </div>
  );
}

const TYPING_STOP_DELAY = 1500;

export function ChatComposer() {
  const composerText = useChatStore((state) => state.composerText);
  const isSoundEnabled = useChatStore((state) => state.isSoundEnabled);
  const sendMediaMessage = useChatStore((state) => state.sendMediaMessage);
  const isSendingMedia = useChatStore((state) => state.isSendingMedia);
  const sendTextMessage = useChatStore((state) => state.sendTextMessage);
  const setComposerText = useChatStore((state) => state.setComposerText);
  const { activeConversationId, activeConversation } = useSelectedConversation();
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const typingUsers = useChatStore((state) => state.typingUsers);
  const mediaInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const sendTypingEvent = useChatStore((state) => state.sendTypingEvent);
  const sendStopTypingEvent = useChatStore((state) => state.sendStopTypingEvent);

  const isPeerTyping = activeConversationId ? !!typingUsers[activeConversationId] : false;
  const peerName = activeConversation?.peer?.name?.split(" ")[0] ?? "";

  const isBlocked = useBlockStore((state) => state.isBlocked);
  const unblockUser = useBlockStore((state) => state.unblockUser);
  const peerIsBlocked = activeConversationId ? isBlocked(activeConversationId) : false;

  const playSoundIfEnabled = () => {
    if (isSoundEnabled) playRandomKeyStrokeSound();
  };

  const stopTyping = () => {
    clearTimeout(typingTimerRef.current);
    sendStopTypingEvent(activeConversationId);
  };

  const handleSend = async () => {
    stopTyping();
    const didSendMessage = await sendTextMessage(activeConversationId);
    if (didSendMessage) playSoundIfEnabled();
  };

  const handleComposerTextChange = (event) => {
    setComposerText(event.target.value);
    playSoundIfEnabled();

    sendTypingEvent(activeConversationId);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, TYPING_STOP_DELAY);
  };

  const handleMediaPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const didSendMessage = await sendMediaMessage({
      conversationId: activeConversationId,
      file,
    });

    if (didSendMessage) playSoundIfEnabled();
  };

  if (peerIsBlocked) {
    return (
      <footer className="shrink-0 border-t border-border">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <BanIcon className="size-4 shrink-0" />
            <span>You have blocked <strong>{activeConversation?.peer?.name}</strong></span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => unblockUser(activeConversationId)}
            className="shrink-0 text-xs"
          >
            Unblock
          </Button>
        </div>
      </footer>
    );
  }

  return (
    <footer className="shrink-0 border-t border-border">
      {isPeerTyping && <TypingIndicator name={peerName} />}
      <AISuggestions />
      <div className="px-1.5 pb-2 pt-2 sm:px-2">
        {isSendingMedia ? (
          <div className="mx-auto mb-2 flex max-w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted">
            <LoaderIcon
              className="size-4 shrink-0 animate-spin text-accent"
              strokeWidth={2}
              aria-hidden
            />
            <span className="truncate">Uploading media...</span>
          </div>
        ) : null}
        <div className="mx-auto flex w-full max-w-full items-end gap-1.5 px-0.5 sm:gap-2 sm:px-1">
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            disabled={isSendingMedia}
            tabIndex={-1}
            aria-hidden
            onChange={handleMediaPick}
          />
          <Button
            variant="ghost"
            isIconOnly
            isDisabled={isSendingMedia}
            className="size-9 shrink-0 touch-manipulation self-end text-accent"
            onPress={() => mediaInputRef.current?.click()}
          >
            <ImageIcon className="size-5 sm:size-6" strokeWidth={2} />
          </Button>
          <TextArea
            fullWidth
            variant="secondary"
            placeholder="ChatKoro"
            rows={1}
            value={composerText}
            onChange={handleComposerTextChange}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 rounded-full"
          />
          <Button variant="primary" isIconOnly isDisabled={!composerText.trim()} onPress={handleSend}>
            <SendHorizontalIcon className="size-5" />
          </Button>
        </div>
      </div>
    </footer>
  );
}
