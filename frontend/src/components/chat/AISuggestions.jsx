import { useState } from "react";
import { Button } from "@heroui/react";
import { SparklesIcon, ChevronDownIcon, ChevronUpIcon, LoaderIcon } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import { useChatStore } from "../../store/useChatStore";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import toast from "react-hot-toast";

export function AISuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [summary, setSummary] = useState("");
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const setComposerText = useChatStore((state) => state.setComposerText);
  const { activeConversationId } = useSelectedConversation();

  const handleSuggest = async () => {
    setLoadingSuggest(true);
    setSuggestions([]);
    try {
      const res = await axiosInstance.get(`/ai/suggest/${activeConversationId}`);
      setSuggestions(res.data.suggestions || []);
    } catch {
      toast.error("Could not get suggestions");
    } finally {
      setLoadingSuggest(false);
    }
  };

  const handleSummarize = async () => {
    if (showSummary && summary) {
      setShowSummary(false);
      return;
    }
    setLoadingSummary(true);
    setShowSummary(true);
    try {
      const res = await axiosInstance.get(`/ai/summarize/${activeConversationId}`);
      setSummary(res.data.summary || "");
    } catch {
      toast.error("Could not summarize");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handlePickSuggestion = (text) => {
    setComposerText(text);
    setSuggestions([]);
  };

  return (
    <div className="shrink-0 border-t border-border px-3 py-2 space-y-2">
      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-xs text-accent border border-border rounded-full px-3"
          onPress={handleSuggest}
          isDisabled={loadingSuggest}
        >
          {loadingSuggest ? (
            <LoaderIcon className="size-3 animate-spin" />
          ) : (
            <SparklesIcon className="size-3" />
          )}
          Suggest reply
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-xs text-muted border border-border rounded-full px-3"
          onPress={handleSummarize}
          isDisabled={loadingSummary}
        >
          {loadingSummary ? (
            <LoaderIcon className="size-3 animate-spin" />
          ) : showSummary ? (
            <ChevronUpIcon className="size-3" />
          ) : (
            <ChevronDownIcon className="size-3" />
          )}
          {showSummary ? "Hide summary" : "Summarize chat"}
        </Button>
      </div>

      {/* Summary panel */}
      {showSummary && summary && (
        <div className="rounded-xl bg-surface border border-border px-3 py-2 text-xs text-muted leading-relaxed">
          <span className="font-semibold text-accent mr-1">Summary:</span>
          {summary}
        </div>
      )}

      {/* Suggestion chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handlePickSuggestion(s)}
              className="text-xs rounded-full border border-border bg-surface hover:bg-accent hover:text-white hover:border-accent px-3 py-1 transition-colors text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
