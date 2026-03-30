import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { PageBackground } from "@/components/shared/page-background";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("My DevRoom");
  const [newRoomLanguage, setNewRoomLanguage] = useState("javascript");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "create-room") {
      setIsCreateModalOpen(true);
      // Clean up the URL
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  const handleCreateRoomClick = async () => {
    if (!supabase) {
      navigate(
        `/login?redirect=create-room&message=${encodeURIComponent(
          "Please sign in to create a room.",
        )}`,
      );
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate(
        `/login?redirect=create-room&message=${encodeURIComponent(
          "Please sign in to create a room.",
        )}`,
      );
      return;
    }

    setIsCreateModalOpen(true);
  };

  const handleConfirmCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      setIsLoading(true);
      const room = await api.createRoom(newRoomName, newRoomLanguage);
      navigate(`/room/${room.id}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room: " + error.message);
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) return;

    if (!supabase) {
      navigate(
        `/login?redirect=/room/${encodeURIComponent(
          roomId.trim(),
        )}&message=${encodeURIComponent("Please sign in to join a room.")}`,
      );
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate(
        `/login?redirect=/room/${encodeURIComponent(
          roomId.trim(),
        )}&message=${encodeURIComponent("Please sign in to join a room.")}`,
      );
      return;
    }

    navigate(`/room/${roomId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <PageBackground />
      <Navbar />

      <main className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl w-full text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight leading-tight">
            Your Room.
            <br />
            Your Code.
            <br />
            Real Time.
          </h1>
          <p className="text-muted-foreground text-lg mb-12">
            Create a DevRoom, share the link, and build together instantly.
          </p>

          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
            <Button
              onClick={handleCreateRoomClick}
              size="lg"
              className="w-full px-8 py-6 bg-foreground text-background hover:bg-foreground/90 text-base font-medium"
            >
              Create Room
            </Button>

            <div className="flex items-center gap-2 w-full text-muted-foreground text-sm">
              <div className="flex-1 h-px bg-border" />
              <span>or join existing</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex items-center gap-2 w-full">
              <Input
                type="text"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground h-12"
              />
              <Button
                onClick={handleJoinRoom}
                size="lg"
                className="px-8 h-12 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium"
              >
                Join
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Create DevRoom</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Set up your environment. You can invite others once you create the
              room.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmCreateRoom} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="E.g., Interview Prep, Project Collab"
                className="bg-input border-border"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Primary Language</Label>
              <Select
                value={newRoomLanguage}
                onValueChange={setNewRoomLanguage}
              >
                <SelectTrigger className="w-full bg-input border-border">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="border-border hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                {isLoading ? "Creating..." : "Create Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
