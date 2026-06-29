export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatLastSeen(date) {
  if (!date) return "Offline";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "last seen just now";
  if (mins < 60) return `last seen ${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `last seen ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `last seen ${days} day${days === 1 ? "" : "s"} ago`;
  return `last seen on ${new Date(date).toLocaleDateString([], { month: "short", day: "numeric" })}`;
}
