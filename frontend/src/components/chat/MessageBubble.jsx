import { useRef, useState } from "react";
import { PencilIcon } from "lucide-react";
import { withTransform } from "../../lib/imagekit";
import { MessageVideo } from "./MessageVideo";

const IMAGE_TRANSFORM = "q-auto,w-640,f-auto";
const EDIT_WINDOW_MS = 15 * 60 * 1000;

function MessageTicks({ status }) {
  const isRead = status === "read";
  const isDelivered = status === "delivered" || isRead;
  const tickColor = isRead ? "#53bdeb" : "currentColor";

  if (!isDelivered) {
    return (
      <svg
        className="ml-1 inline-block shrink-0 opacity-75"
        width="13"
        height="10"
        viewBox="0 0 13 10"
        fill="none"
      >
        <path
          d="M1 5L4.5 8.5L12 1"
          stroke={tickColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className="ml-1 inline-block shrink-0"
      width="18"
      height="10"
      viewBox="0 0 18 10"
      fill="none"
    >
      <path
        d="M1 5L4.5 8.5L12 1"
        stroke={tickColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isRead ? 1 : 0.75}
      />
      <path
        d="M6 5L9.5 8.5L17 1"
        stroke={tickColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isRead ? 1 : 0.75}
      />
    </svg>
  );
}

export function MessageBubble({ message, onEdit }) {
  const isOwnMessage = message.role === "me";
  const hasImage = Boolean(message.imageUrl);
  const hasVideo = Boolean(message.videoUrl);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const textareaRef = useRef(null);

  const withinEditWindow =
    message.createdAt && Date.now() - new Date(message.createdAt).getTime() < EDIT_WINDOW_MS;
  const canEdit = isOwnMessage && !hasImage && !hasVideo && withinEditWindow;

  function startEditing() {
    setEditText(message.text);
    setIsEditing(true);
    // focus on next tick after render
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(editText.length, editText.length);
      }
    }, 0);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditText(message.text);
  }

  async function saveEdit() {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.text) {
      cancelEditing();
      return;
    }
    const ok = await onEdit(message.id, trimmed);
    if (ok) setIsEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  }

  return (
    <div className={`group/bubble flex w-full items-end gap-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      {/* Edit pencil — left of own-message bubble */}
      {canEdit && !isEditing && (
        <button
          type="button"
          onClick={startEditing}
          title="Edit message"
          className="mb-1 shrink-0 rounded-md p-1 opacity-0 transition-opacity hover:bg-accent group-hover/bubble:opacity-100"
        >
          <PencilIcon className="size-3.5 text-muted-foreground" />
        </button>
      )}

      <div
        className={`max-w-[min(90%,28rem)] rounded-2xl px-3 py-2 text-[15px] leading-snug sm:max-w-[min(75%,28rem)] sm:px-3.5 ${
          isOwnMessage
            ? "rounded-br-md bg-accent text-accent-foreground"
            : "rounded-bl-md bg-surface"
        }`}
      >
        {hasImage ? (
          <img
            src={withTransform(message.imageUrl, IMAGE_TRANSFORM)}
            alt=""
            className="mb-1.5 max-h-40 max-w-full rounded-lg object-cover sm:max-h-52 sm:rounded-xl"
          />
        ) : null}
        {hasVideo ? <MessageVideo src={message.videoUrl} /> : null}

        {isEditing ? (
          <div className="flex flex-col gap-1.5">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={Math.min(6, editText.split("\n").length + 1)}
              className="w-full resize-none rounded-lg bg-accent-foreground/10 px-2 py-1 text-[15px] leading-snug outline-none placeholder:text-muted-foreground"
            />
            <div className="flex justify-end gap-2 text-[12px]">
              <button
                type="button"
                onClick={cancelEditing}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="font-semibold text-accent hover:opacity-80"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          message.text ? (
            <p className="whitespace-pre-wrap wrap-break-word">{message.text}</p>
          ) : null
        )}

        <p
          className={`mt-1 flex items-center justify-end gap-0.5 text-[11px] tabular-nums ${
            isOwnMessage ? "text-accent-foreground/75" : "text-muted"
          }`}
        >
          {message.isEdited && <span className="mr-0.5 italic">edited</span>}
          {message.time}
          {isOwnMessage ? <MessageTicks status={message.status} /> : null}
        </p>
      </div>
    </div>
  );
}
