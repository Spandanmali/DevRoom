import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { PageBackground } from "@/components/shared/page-background";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = async () => {
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
    const newRoomId = Math.random().toString(36).substring(2, 8);
    navigate(`/room/${newRoomId}`);
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
              onClick={handleCreateRoom}
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
    </div>
  );
}
