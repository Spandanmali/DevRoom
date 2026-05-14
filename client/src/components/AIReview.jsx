import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AIReview({ code, language }) {
  const [isLoading, setIsLoading] = useState(false);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");

  const handleReview = async () => {
    if (!code || !code.trim()) {
      setError("No code available to review yet.");
      setReview("");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await api.reviewCode(code, language);
      if (!data?.review) {
        throw new Error("No review content returned from server.");
      }
      setReview(data.review);
    } catch (err) {
      setError(err?.message || "Failed to review code.");
      setReview("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0">
      <Button
        onClick={handleReview}
        disabled={isLoading}
        className="w-full h-9 gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Reviewing...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Review my code
          </>
        )}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex-1 min-h-0 border border-border bg-input p-2 rounded-md overflow-hidden relative">
        {review ? (
          <div className="h-full w-full overflow-y-auto pr-2 absolute inset-0 p-2 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{review}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground absolute inset-0 p-2">
            Click "Review my code" to get Gemini feedback in this sidebar.
          </p>
        )}
      </div>
    </div>
  );
}
