import { withTransform } from "../../lib/imagekit";
import { MessageVideo } from "./MessageVideo";

// Compress + size images for the bubble (q-auto works for images; f-auto picks WebP/AVIF).
const IMAGE_TRANSFORM = "q-auto,w-640,f-auto";

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

export function MessageBubble({ message }) {
  const isOwnMessage = message.role === "me";
  const hasImage = Boolean(message.imageUrl);
  const hasVideo = Boolean(message.videoUrl);

  return (
    <div className={`flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}>
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
        {message.text ? (
          <p className="whitespace-pre-wrap wrap-break-word">{message.text}</p>
        ) : null}
        <p
          className={`mt-1 flex items-center justify-end gap-0.5 text-[11px] tabular-nums ${
            isOwnMessage ? "text-accent-foreground/75" : "text-muted"
          }`}
        >
          {message.time}
          {isOwnMessage ? <MessageTicks status={message.status} /> : null}
        </p>
      </div>
    </div>
  );
}
