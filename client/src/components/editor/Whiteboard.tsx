import { useState, useEffect, useRef, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

interface WhiteboardProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Whiteboard({ roomId, isOpen, onClose }: WhiteboardProps) {
  const [initialData, setInitialData] = useState<readonly ExcalidrawElement[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const elementsRef = useRef<readonly ExcalidrawElement[]>([]);

  // Fetch initial whiteboard data
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchWhiteboard = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("rooms")
          .select("whiteboard_data")
          .eq("id", roomId)
          .single();

        if (error) {
          throw error;
        }

        if (data && data.whiteboard_data && isMounted) {
          try {
            const parsed = JSON.parse(data.whiteboard_data);
            setInitialData(parsed);
          } catch (e) {
            console.error("Failed to parse whiteboard data:", e);
          }
        }
      } catch (err) {
        console.error("Failed to load whiteboard:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWhiteboard();

    return () => {
      isMounted = false;
      // Also save on unmount if we have data
      if (elementsRef.current.length > 0) {
        saveWhiteboardData(elementsRef.current);
      }
    };
  }, [roomId, isOpen]);

  const saveWhiteboardData = async (elements: readonly ExcalidrawElement[]) => {
    setSaveStatus("saving");
    try {
      const { error } = await supabase
        .from("rooms")
        .update({ whiteboard_data: JSON.stringify(elements) })
        .eq("id", roomId);

      if (error) throw error;
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to save whiteboard:", err);
      setSaveStatus("idle");
      toast.error("Failed to save whiteboard");
    }
  };

  const handleOnChange = useCallback((elements: readonly ExcalidrawElement[]) => {
    elementsRef.current = elements;
    
    // Debounce save (2 seconds)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(() => {
      saveWhiteboardData(elements);
    }, 2000);
  }, [roomId]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-background">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-foreground">Whiteboard</h2>
          {saveStatus === "saving" && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <Check className="h-3 w-3" /> Auto-saved
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Loading whiteboard...</span>
          </div>
        ) : (
          <Excalidraw
            theme="dark"
            initialData={{ elements: initialData || [] }}
            onChange={handleOnChange}
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: false,
                clearCanvas: true,
                loadScene: false,
                saveToActiveFile: false,
                toggleTheme: false,
                saveAsImage: false,
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
