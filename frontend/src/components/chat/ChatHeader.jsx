import { useEffect, useRef, useState } from "react";
import { Avatar, Button } from "@heroui/react";
import { BanIcon, BellIcon, BellOffIcon, ChevronLeftIcon, Volume2Icon, VolumeXIcon, XIcon } from "lucide-react";
import { AppLogo } from "../AppLogo";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";

import { ThemePresetPicker } from "../ThemePresetPicker";
import { ThemeToggle } from "../ThemeToggle";
import { WallpaperPicker } from "../WallpaperPicker";

import { useChatStore } from "../../store/useChatStore";
import { useBlockStore } from "../../store/useBlockStore";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";

const MUTE_OPTIONS = [
  { label: "For 8 hours", value: "8h" },
  { label: "For 1 week", value: "1w" },
  { label: "Forever", value: "forever" },
];

export function ChatHeader() {
  const isSoundEnabled = useChatStore((state) => state.isSoundEnabled);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const setSoundEnabled = useChatStore((state) => state.setSoundEnabled);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const mutedConversations = useChatStore((state) => state.mutedConversations);
  const muteConversation = useChatStore((state) => state.muteConversation);
  const unmuteConversation = useChatStore((state) => state.unmuteConversation);

  const { activeConversation, activeConversationId, isLargeScreen } = useSelectedConversation();

  const [muteMenuOpen, setMuteMenuOpen] = useState(false);
  const muteMenuRef = useRef(null);

  const isMuted = (() => {
    if (!activeConversationId) return false;
    const entry = mutedConversations.find((m) => String(m.userId) === String(activeConversationId));
    if (!entry) return false;
    if (entry.mutedUntil === null) return true;
    return new Date(entry.mutedUntil) > new Date();
  })();

  useEffect(() => {
    if (!muteMenuOpen) return;
    function handleClickOutside(e) {
      if (muteMenuRef.current && !muteMenuRef.current.contains(e.target)) {
        setMuteMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [muteMenuOpen]);

  async function handleMuteOption(duration) {
    setMuteMenuOpen(false);
    if (!activeConversationId) return;
    await muteConversation(activeConversationId, duration);
  }

  async function handleUnmute() {
    if (!activeConversationId) return;
    await unmuteConversation(activeConversationId);
  }
  const isPeerTyping = activeConversationId ? !!typingUsers[activeConversationId] : false;

  const getBlockedUsers = useBlockStore((state) => state.getBlockedUsers);
  const blockUser = useBlockStore((state) => state.blockUser);
  const unblockUser = useBlockStore((state) => state.unblockUser);
  const isBlocked = useBlockStore((state) => state.isBlocked);

  useEffect(() => {
    getBlockedUsers();
  }, []);

  const peerId = activeConversationId;
  const peerIsBlocked = peerId ? isBlocked(peerId) : false;

  const handleToggleBlock = async () => {
    if (!peerId) return;
    if (peerIsBlocked) {
      await unblockUser(peerId);
    } else {
      await blockUser(peerId);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-1 border-b border-border px-1.5 py-1.5 sm:gap-2 sm:px-2 sm:py-2">
      {activeConversation && !isLargeScreen ? (
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          className="shrink-0"
          onPress={() => setActiveConversationId(null)}
        >
          <ChevronLeftIcon className="size-6" strokeWidth={2.25} />
        </Button>
      ) : null}

      {activeConversation ? (
        <>
          <AvatarWithOnlineIndicator isOnline={!peerIsBlocked && (activeConversation.peer.isOnline ?? true)}>
            <Avatar className="size-9 shrink-0">
              <Avatar.Image
                alt={activeConversation.peer.name}
                src={activeConversation.peer.avatarUrl}
              />
              <Avatar.Fallback className="text-sm font-medium">
                {activeConversation.peer.initials}
              </Avatar.Fallback>
            </Avatar>
          </AvatarWithOnlineIndicator>

          <div className="flex-1 text-center sm:text-left">
            <p className="truncate text-[15px] font-semibold leading-tight">
              {activeConversation.peer.name}
            </p>
            <p className="truncate text-xs text-muted">
              {peerIsBlocked ? (
                <span className="font-medium text-destructive">Blocked</span>
              ) : isPeerTyping ? (
                <span className="animate-pulse font-medium text-accent">typing...</span>
              ) : activeConversation.peer.isOnline ? (
                <span className="font-medium text-success">Online</span>
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center gap-2.5 sm:text-left">
          <AppLogo size={36} className="rounded-[9px]" />
          <div className="flex-1 text-center sm:text-left">
            <p className="truncate text-[13px] font-medium text-muted">Select a conversation</p>
          </div>
        </div>
      )}

      <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-0.5 sm:gap-1">
        <div className="hidden min-[400px]:contents">
          <WallpaperPicker />
          <ThemePresetPicker />
        </div>

        <ThemeToggle />

        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          className="shrink-0"
          aria-pressed={isSoundEnabled}
          onPress={() => setSoundEnabled(!isSoundEnabled)}
        >
          {isSoundEnabled ? (
            <Volume2Icon className="size-5.5" strokeWidth={2} aria-hidden />
          ) : (
            <VolumeXIcon className="size-5.5" strokeWidth={2} aria-hidden />
          )}
        </Button>

        {activeConversation ? (
          <>
            {/* Mute button */}
            <div className="relative shrink-0" ref={muteMenuRef}>
              {isMuted ? (
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label="Unmute conversation"
                  title="Unmute conversation"
                  onPress={handleUnmute}
                >
                  <BellOffIcon className="size-5 text-muted-foreground" strokeWidth={2} aria-hidden />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label="Mute conversation"
                  title="Mute conversation"
                  onPress={() => setMuteMenuOpen((v) => !v)}
                >
                  <BellIcon className="size-5" strokeWidth={2} aria-hidden />
                </Button>
              )}

              {muteMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                  {MUTE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className="flex w-full items-center px-4 py-2.5 text-left text-sm hover:bg-accent"
                      onClick={() => handleMuteOption(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              className={`shrink-0 ${peerIsBlocked ? "text-destructive" : ""}`}
              aria-label={peerIsBlocked ? "Unblock user" : "Block user"}
              title={peerIsBlocked ? "Unblock user" : "Block user"}
              onPress={handleToggleBlock}
            >
              <BanIcon className="size-5" strokeWidth={2} aria-hidden />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              className="shrink-0"
              aria-label="Close chat"
              onPress={() => setActiveConversationId(null)}
            >
              <XIcon className="size-5.5" strokeWidth={2} aria-hidden />
            </Button>
          </>
        ) : null}
      </div>
    </header>
  );
}
