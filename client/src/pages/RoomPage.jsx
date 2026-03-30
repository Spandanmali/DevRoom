import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { LeftPanel } from "@/components/editor/left-panel";
import { CenterPanel } from "@/components/editor/center-panel";
import { RightPanel } from "@/components/editor/right-panel";
import { RightPanelToggle } from "@/components/editor/right-panel-toggle";
import { VoiceBar } from "@/components/editor/voice-bar";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const SAMPLE_CODE = `// Real-time collaborative code editor
// Start typing...
`;

export default function RoomPage() {
  const { roomId = "room" } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [roomName, setRoomName] = useState("Loading...");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(SAMPLE_CODE);
  const [rightPanelView, setRightPanelView] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initRoom = async () => {
      try {
        // 1. Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && isMounted) {
          const userObj = {
            id: session.user.id,
            name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "You",
            color: "#f97316", // Default color for you
            isOnline: true,
            isCurrentUser: true,
          };
          setCurrentUser(userObj);
          setActiveUsers([userObj]);
        }

        // Try to join the room first (this will succeed if already joined, or add the user, or fail if 404)
        await api.joinRoom(roomId);

        // Fetch the initial room state
        const roomData = await api.getRoom(roomId);

        if (isMounted) {
          setRoomName(roomData.name);
          setLanguage(roomData.language || "javascript");

          // Eventually this will be powered by sockets, but for now we load participants from db
          if (roomData.participants && session) {
            // Deduplicate participants by ID to prevent multiple entries if db constraints are missing
            const uniqueParticipants = Array.from(
              new Map(roomData.participants.map((p) => [p.id, p])).values(),
            );

            const mappedUsers = uniqueParticipants.map((p) => {
              const isMe = p.id === session.user.id;
              const baseName = p.name || p.email?.split("@")[0] || "Anonymous";
              return {
                id: p.id,
                name: isMe ? `${baseName} (You)` : baseName,
                color: isMe ? "#f97316" : "#3b82f6",
                isOnline: true, // we assume online for now until sockets are active
                isCurrentUser: isMe,
              };
            });

            // Sort so current user appears first
            mappedUsers.sort((a, b) => {
              if (a.isCurrentUser) return -1;
              if (b.isCurrentUser) return 1;
              return 0;
            });

            setActiveUsers(mappedUsers);
          }

          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to join room:", err);
          alert("Room not found or you don't have access.");
          navigate("/");
        }
      }
    };

    initRoom();

    return () => {
      isMounted = false;
    };
  }, [roomId, navigate]);

  const handleRunCode = () => {
    setIsRunning(true);
    setRightPanelView("output");
    setOutput("");
    setError("");

    setTimeout(() => {
      setOutput("Run output will appear here soon...");
      setIsRunning(false);
    }, 1000);
  };

  const handleSendMessage = (message) => {
    if (!currentUser) return;

    const newMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.name,
      color: currentUser.color,
      message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages([...messages, newMessage]);
  };

  const handleAIReview = () => {
    setRightPanelView("ai-review");
  };

  const handleAIFix = () => {
    setRightPanelView("ai-review");
  };

  const togglePanel = (view) => {
    if (rightPanelView === view) {
      setRightPanelView(null);
    } else {
      setRightPanelView(view);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        Loading room...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <EditorNavbar
        roomId={roomId}
        roomName={roomName}
        onRoomNameChange={setRoomName}
        language={language}
        onLanguageChange={setLanguage}
        users={activeUsers}
        onRun={handleRunCode}
        isRunning={isRunning}
      />

      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          users={activeUsers}
          messages={messages}
          onSendMessage={handleSendMessage}
          onAIReview={handleAIReview}
          onAIFix={handleAIFix}
        />

        <CenterPanel
          code={code}
          onChange={setCode}
          language={language}
          users={activeUsers.filter((u) => !u.isCurrentUser)}
        />

        {rightPanelView && (
          <RightPanel
            view={rightPanelView}
            output={output}
            error={error}
            input={input}
            onInputChange={setInput}
            isRunning={isRunning}
          />
        )}

        <RightPanelToggle activeView={rightPanelView} onToggle={togglePanel} />
      </div>

      <VoiceBar users={activeUsers} />
    </div>
  );
}
