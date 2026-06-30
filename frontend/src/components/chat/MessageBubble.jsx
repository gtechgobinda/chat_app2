import { useEffect, useRef, useState } from "react";
import { BookmarkIcon, CornerUpLeftIcon, PencilIcon, PinIcon, PinOffIcon, SmilePlusIcon, TrashIcon } from "lucide-react";
import { withTransform } from "../../lib/imagekit";
import { MessageVideo } from "./MessageVideo";

const IMAGE_TRANSFORM = "q-auto,w-640,f-auto";
const EDIT_WINDOW_MS = 15 * 60 * 1000;
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

// ─── helpers ────────────────────────────────────────────────────────────────

function groupReactions(reactions) {
  const map = new Map();
  for (const { emoji, userId } of reactions) {
    if (!map.has(emoji)) map.set(emoji, []);
    map.get(emoji).push(userId);
  }
  return [...map.entries()]; // [[emoji, [userId, ...]], ...]
}

// ─── sub-components ─────────────────────────────────────────────────────────

function MessageTicks({ status }) {
  const isRead = status === "read";
  const isDelivered = status === "delivered" || isRead;
  const tickColor = isRead ? "#53bdeb" : "currentColor";

  if (!isDelivered) {
    return (
      <svg className="ml-1 inline-block shrink-0 opacity-75" width="13" height="10" viewBox="0 0 13 10" fill="none">
        <path d="M1 5L4.5 8.5L12 1" stroke={tickColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="ml-1 inline-block shrink-0" width="18" height="10" viewBox="0 0 18 10" fill="none">
      <path d="M1 5L4.5 8.5L12 1" stroke={tickColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={isRead ? 1 : 0.75} />
      <path d="M6 5L9.5 8.5L17 1" stroke={tickColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={isRead ? 1 : 0.75} />
    </svg>
  );
}

function EmojiPicker({ isOwnMessage, myReaction, onReact, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute bottom-full z-50 mb-2 flex items-center gap-0.5 rounded-full border border-border bg-background p-1 shadow-lg ${
        isOwnMessage ? "right-0" : "left-0"
      }`}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => { onReact(emoji); onClose(); }}
          className={`rounded-full px-1.5 py-0.5 text-lg leading-none transition-transform hover:scale-125 ${
            myReaction === emoji ? "bg-accent/30" : ""
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function DeleteMenu({ isOwner, onDelete, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full z-50 mb-1 min-w-44 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
      style={isOwner ? { right: 0 } : { left: 0 }}
    >
      {isOwner && (
        <button
          type="button"
          className="flex w-full items-center px-4 py-2.5 text-left text-sm text-destructive hover:bg-accent"
          onClick={() => { onDelete("everyone"); onClose(); }}
        >
          Delete for everyone
        </button>
      )}
      <button
        type="button"
        className="flex w-full items-center px-4 py-2.5 text-left text-sm hover:bg-accent"
        onClick={() => { onDelete("me"); onClose(); }}
      >
        Delete for me
      </button>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function MessageBubble({ message, onEdit, onDelete, onPin, onUnpin, onReact, onReply, onStar, onUnstar, highlighted }) {
  const isOwnMessage = message.role === "me";
  const hasImage = Boolean(message.imageUrl);
  const hasVideo = Boolean(message.videoUrl);

  const [isEditing, setIsEditing]       = useState(false);
  const [editText, setEditText]         = useState(message.text);
  const [pickerOpen, setPickerOpen]     = useState(false);
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);
  const textareaRef = useRef(null);

  const withinEditWindow =
    message.createdAt && Date.now() - new Date(message.createdAt).getTime() < EDIT_WINDOW_MS;
  const canEdit =
    isOwnMessage && !hasImage && !hasVideo && withinEditWindow && !message.isDeletedForEveryone;

  function startEditing() {
    setEditText(message.text);
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(editText.length, editText.length);
    }, 0);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditText(message.text);
  }

  async function saveEdit() {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.text) { cancelEditing(); return; }
    const ok = await onEdit(message.id, trimmed);
    if (ok) setIsEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
    else if (e.key === "Escape") cancelEditing();
  }

  const groupedReactions = groupReactions(message.reactions ?? []);

  const actionBtn =
    "mb-1 shrink-0 rounded-md p-1 opacity-0 transition-opacity hover:bg-accent group-hover/bubble:opacity-100";

  const highlightClass = highlighted
    ? "ring-2 ring-accent ring-offset-1 rounded-2xl transition-all duration-300"
    : "";

  // ── deleted-for-everyone variant ───────────────────────────────────────────
  if (message.isDeletedForEveryone) {
    return (
      <div data-message-id={message.id} className={`flex w-full ${isOwnMessage ? "justify-end" : "justify-start"} ${highlightClass}`}>
        <div className={`max-w-[min(90%,28rem)] rounded-2xl px-3 py-2 text-[15px] leading-snug sm:max-w-[min(75%,28rem)] sm:px-3.5 ${isOwnMessage ? "rounded-br-md bg-accent/40" : "rounded-bl-md bg-surface"}`}>
          <p className="italic text-muted">This message was deleted</p>
          <p className={`mt-1 flex items-center justify-end gap-0.5 text-[11px] tabular-nums ${isOwnMessage ? "text-accent-foreground/60" : "text-muted"}`}>
            {message.time}
            {isOwnMessage ? <MessageTicks status={message.status} /> : null}
          </p>
        </div>
      </div>
    );
  }

  // ── normal variant ─────────────────────────────────────────────────────────
  return (
    <div
      data-message-id={message.id}
      className={`group/bubble flex w-full items-end gap-1 ${isOwnMessage ? "justify-end" : "justify-start"} ${highlightClass}`}
    >
      {/* ── Own-message actions (left of bubble) ── */}
      {isOwnMessage && !isEditing && (
        <div className="flex shrink-0 items-center gap-0.5">
          {canEdit && (
            <button type="button" onClick={startEditing} title="Edit" className={actionBtn}>
              <PencilIcon className="size-3.5 text-muted-foreground" />
            </button>
          )}
          <button type="button" title="Reply" className={actionBtn} onClick={() => onReply(message)}>
            <CornerUpLeftIcon className="size-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            title="React"
            className={actionBtn}
            onClick={() => setPickerOpen((v) => !v)}
          >
            <SmilePlusIcon className="size-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            title={message.isPinned ? "Unpin" : "Pin"}
            className={actionBtn}
            onClick={() => (message.isPinned ? onUnpin(message.id) : onPin(message.id))}
          >
            {message.isPinned
              ? <PinOffIcon className="size-3.5 text-accent" />
              : <PinIcon className="size-3.5 text-muted-foreground" />}
          </button>
          <button
            type="button"
            title={message.isStarred ? "Unstar" : "Star"}
            className={actionBtn}
            onClick={() => (message.isStarred ? onUnstar(message.id) : onStar(message.id))}
          >
            <BookmarkIcon
              className={`size-3.5 ${message.isStarred ? "fill-accent text-accent" : "text-muted-foreground"}`}
            />
          </button>
          <div className="relative">
            <button type="button" title="Delete" className={actionBtn} onClick={() => setDeleteMenuOpen((v) => !v)}>
              <TrashIcon className="size-3.5 text-muted-foreground" />
            </button>
            {deleteMenuOpen && (
              <DeleteMenu isOwner={true} onDelete={(s) => onDelete(message.id, s)} onClose={() => setDeleteMenuOpen(false)} />
            )}
          </div>
        </div>
      )}

      {/* ── Bubble + reactions wrapper (relative for picker positioning) ── */}
      <div className={`relative flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>

        {/* Emoji picker */}
        {pickerOpen && (
          <EmojiPicker
            isOwnMessage={isOwnMessage}
            myReaction={message.myReaction}
            onReact={(emoji) => onReact(message.id, emoji)}
            onClose={() => setPickerOpen(false)}
          />
        )}

        {/* Bubble */}
        <div className={`max-w-[min(90%,28rem)] rounded-2xl px-3 py-2 text-[15px] leading-snug sm:max-w-[min(75%,28rem)] sm:px-3.5 ${isOwnMessage ? "rounded-br-md bg-accent text-accent-foreground" : "rounded-bl-md bg-surface"}`}>
          {message.replyTo && (
            <div className={`mb-2 flex flex-col gap-0.5 rounded-lg border-l-2 border-accent/70 px-2.5 py-1.5 ${isOwnMessage ? "bg-black/10" : "bg-black/5 dark:bg-white/10"}`}>
              <span className="truncate text-[11px] font-semibold text-accent">
                {message.replyTo.senderName}
              </span>
              <span className="truncate text-[12px] opacity-70">
                {message.replyTo.imageUrl ? "📷 Photo" : message.replyTo.text}
              </span>
            </div>
          )}

          {hasImage ? (
            <img src={withTransform(message.imageUrl, IMAGE_TRANSFORM)} alt="" className="mb-1.5 max-h-40 max-w-full rounded-lg object-cover sm:max-h-52 sm:rounded-xl" />
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
                className="w-full resize-none rounded-lg bg-accent-foreground/10 px-2 py-1 text-[15px] leading-snug outline-none"
              />
              <div className="flex justify-end gap-2 text-[12px]">
                <button type="button" onClick={cancelEditing} className="text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="button" onClick={saveEdit} className="font-semibold text-accent hover:opacity-80">Save</button>
              </div>
            </div>
          ) : (
            message.text ? <p className="whitespace-pre-wrap wrap-break-word">{message.text}</p> : null
          )}

          <p className={`mt-1 flex items-center justify-end gap-0.5 text-[11px] tabular-nums ${isOwnMessage ? "text-accent-foreground/75" : "text-muted"}`}>
            {message.isEdited && <span className="mr-0.5 italic">edited</span>}
            {message.time}
            {isOwnMessage ? <MessageTicks status={message.status} /> : null}
          </p>
        </div>

        {/* Reaction badges */}
        {groupedReactions.length > 0 && (
          <div className={`-mt-1 mb-1 flex flex-wrap gap-1 ${isOwnMessage ? "justify-end pr-1" : "justify-start pl-1"}`}>
            {groupedReactions.map(([emoji, userIds]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(message.id, emoji)}
                className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[13px] transition-colors ${
                  message.myReaction === emoji
                    ? "border-accent bg-accent/20 font-medium"
                    : "border-border bg-background hover:bg-accent/10"
                }`}
              >
                <span>{emoji}</span>
                {userIds.length > 1 && (
                  <span className="text-[11px] text-muted-foreground">{userIds.length}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Received-message actions (right of bubble) ── */}
      {!isOwnMessage && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" title="Reply" className={actionBtn} onClick={() => onReply(message)}>
            <CornerUpLeftIcon className="size-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            title="React"
            className={actionBtn}
            onClick={() => setPickerOpen((v) => !v)}
          >
            <SmilePlusIcon className="size-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            title={message.isPinned ? "Unpin" : "Pin"}
            className={actionBtn}
            onClick={() => (message.isPinned ? onUnpin(message.id) : onPin(message.id))}
          >
            {message.isPinned
              ? <PinOffIcon className="size-3.5 text-accent" />
              : <PinIcon className="size-3.5 text-muted-foreground" />}
          </button>
          <button
            type="button"
            title={message.isStarred ? "Unstar" : "Star"}
            className={actionBtn}
            onClick={() => (message.isStarred ? onUnstar(message.id) : onStar(message.id))}
          >
            <BookmarkIcon
              className={`size-3.5 ${message.isStarred ? "fill-accent text-accent" : "text-muted-foreground"}`}
            />
          </button>
          <div className="relative">
            <button type="button" title="Remove from chat" className={actionBtn} onClick={() => setDeleteMenuOpen((v) => !v)}>
              <TrashIcon className="size-3.5 text-muted-foreground" />
            </button>
            {deleteMenuOpen && (
              <DeleteMenu isOwner={false} onDelete={(s) => onDelete(message.id, s)} onClose={() => setDeleteMenuOpen(false)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
