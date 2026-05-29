import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { LeftPanel } from "@/components/editor/left-panel";
import { CenterPanel } from "@/components/editor/center-panel";
import { RightPanel } from "@/components/editor/right-panel";
import { Whiteboard } from "@/components/editor/Whiteboard";
import { InterviewMode } from "@/components/interview/InterviewMode";
import InterviewRoom from "@/components/interview/InterviewRoom";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { initSocket } from "@/lib/socket";

import { toast } from "sonner";

const USER_COLORS = [
  "#f97316", // orange
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // indigo
  "#ec4899", // pink
  "#eab308", // yellow
  "#14b8a6", // teal
  "#ef4444", // red
];

function getUserColor(userId) {
  if (!userId) return "#3b82f6";
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

const SAMPLE_CODE = `// Real-time collaborative code editor
// Start typing...
`;

export default function RoomPage() {
  const { roomId = "room" } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [roomName, setRoomName] = useState("Loading...");
  const [language, setLanguage] = useState("javascript-node");
  const [code, setCode] = useState(SAMPLE_CODE);
  const [saveStatus, setSaveStatus] = useState("Saved ☁️");
  const [rightPanelView, setRightPanelView] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [isInterviewActive, setIsInterviewActive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let localSocket = null;

    const initRoom = async () => {
      try {
        // 1. Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Try to join the room first
        await api.joinRoom(roomId);

        // Fetch the initial room state
        const roomData = await api.getRoom(roomId);

        let userObj = null;
        if (session && isMounted) {
          userObj = {
            id: session.user.id,
            name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "You",
            color: getUserColor(session.user.id),
            isOnline: true,
            isCurrentUser: true,
            isOwner: session.user.id === roomData.created_by,
          };
          setCurrentUser(userObj);
          setActiveUsers([userObj]);
        }

        if (isMounted) {
          setRoomName(roomData.name);
          setIsInterviewActive(!!roomData.is_interview_mode);

          let dbLang = roomData.language || "javascript-node";
          if (dbLang === "javascript") dbLang = "javascript-node";
          setLanguage(dbLang);

          // Load saved code from Supabase if it exists (latest snippet for this room)
          const { data: snippets } = await supabase
            .from("snippets")
            .select("code, language")
            .eq("room_id", roomId)
            .order("created_at", { ascending: false })
            .limit(1);

          if (snippets && snippets.length > 0) {
            setCode(snippets[0].code);
            if (snippets[0].language) setLanguage(snippets[0].language);
          }

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
                color: getUserColor(p.id),
                isOnline: false, // Will be updated by socket events
                isCurrentUser: isMe,
                isOwner: p.id === roomData.created_by,
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

  // Separate Effect for Socket Initialization
  useEffect(() => {
    if (!currentUser || isLoading) return;

    let isSubscribed = true;
    let localSocket = null;

    const setupSocket = async () => {
      localSocket = await initSocket();

      if (!isSubscribed) {
        localSocket.disconnect();
        return;
      }

      setSocket(localSocket);

      const handleSocketJoin = () => {
        console.log("Emitting join-room...");
        localSocket.emit("join-room", {
          roomId,
          user: currentUser,
        });
      };

      if (localSocket.connected) {
        handleSocketJoin();
      }

      localSocket.on("connect", () => {
        console.log("Socket 'connect' event fired");
        handleSocketJoin();
      });

      localSocket.on("disconnect", (reason) => {
        console.warn("Socket disconnected:", reason);
      });

      localSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      // Handle user connection and syncing active user lists
      localSocket.on("user-connected", ({ user, socketId, clients }) => {
        console.log("🔥 [Socket] user-connected event received!", {
          user,
          socketId,
          clients,
          currentUser,
        });
        try {
          if (socketId !== localSocket.id) {
            toast.success(`${user?.name || "A user"} joined the room`);
          }
        } catch (e) {
          console.error("Error triggering toast:", e);
        }

        setActiveUsers((prevUsers) => {
          const activeIds = new Set(
            clients.map((c) => c.user?.id).filter(Boolean),
          );

          let newUsersMap = new Map();
          prevUsers.forEach((u) => newUsersMap.set(u.id, u));

          clients.forEach((client) => {
            if (client.user && client.user.id) {
              const existingUser = newUsersMap.get(client.user.id);
              if (existingUser) {
                newUsersMap.set(client.user.id, {
                  ...existingUser,
                  isOnline: true,
                });
              } else {
                newUsersMap.set(client.user.id, {
                  ...client.user,
                  color: getUserColor(client.user.id),
                  name:
                    client.user.id === currentUser.id
                      ? `${client.user.name} (You)`
                      : client.user.name,
                  isOnline: true,
                  isCurrentUser: client.user.id === currentUser.id,
                });
              }
            }
          });

          let newUsers = Array.from(newUsersMap.values()).map((u) => ({
            ...u,
            isOnline: u.isCurrentUser ? true : activeIds.has(u.id),
          }));

          newUsers.sort((a, b) => {
            if (a.isCurrentUser) return -1;
            if (b.isCurrentUser) return 1;
            return 0;
          });

          return newUsers;
        });
      });

      // Handle user disconnection / leaving
      localSocket.on("user-disconnected", ({ user, socketId, clients }) => {
        try {
          if (socketId !== localSocket.id) {
            toast.error(`${user?.name || "A user"} left the room`);
          }
        } catch (e) {
          console.error("Error triggering toast error:", e);
        }

        setActiveUsers((prevUsers) => {
          const activeIds = new Set(
            clients ? clients.map((c) => c.user?.id).filter(Boolean) : [],
          );

          // Always keep the current user and update online status of others
          return prevUsers.map((u) => ({
            ...u,
            isOnline: u.isCurrentUser ? true : activeIds.has(u.id),
          }));
        });
      });

      // Listen for save notifications from the backend
      localSocket.on("code-saved", () => {
        setSaveStatus("Saved to cloud ☁️");
        setTimeout(() => {
          setSaveStatus("Saved ☁️");
        }, 3000);
      });

      // Listen for interview status changes to update navbar
      localSocket.on("interview-started", () => {
        setIsInterviewActive(true);
      });
      // Removing interview-ended from RoomPage, let InterviewRoom handle it
    };

    setupSocket();

    return () => {
      isSubscribed = false;
      if (localSocket) {
        localSocket.emit("leave-room", { roomId });
        localSocket.disconnect();
      }
    };
  }, [currentUser, roomId, isLoading]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setRightPanelView("output");
    setOutput(null);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/code/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          script: code,
          language,
          stdin: input,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Execution failed");
        setOutput({
          statusCode: data.statusCode || 500,
          output: data.error || data.message || "Execution failed",
        });
      } else {
        setOutput(data);
        if (data.statusCode !== 200) {
          setError("Execution finished with errors.");
        }
      }
    } catch (err) {
      setError(err.message || "Network error occurred");
      setOutput({ statusCode: 500, output: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleAIReview = () => {
    setRightPanelView("ai-review");
  };

  const handleAIFix = () => {
    setRightPanelView("ai-review");
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setSaveStatus("Unsaved changes...");
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        Loading room...
      </div>
    );
  }

  if (isInterviewActive) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden relative">
        <InterviewRoom
          roomId={roomId}
          currentUser={currentUser}
          isHost={currentUser?.isOwner}
          socket={socket}
          onInterviewEnd={() => setIsInterviewActive(false)}
          code={code}
          onCodeChange={handleCodeChange}
          language={language}
          onLanguageChange={setLanguage}
        />
        {/* We still render this invisible so we don't break the start/stop logic of the modal if needed, or we can leave it out. Actually, InterviewMode is only for starting an interview. */}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      <EditorNavbar
        roomId={roomId}
        roomName={roomName}
        onRoomNameChange={setRoomName}
        language={language}
        onLanguageChange={setLanguage}
        users={activeUsers}
        onRun={handleRunCode}
        isRunning={isRunning}
        isWhiteboardOpen={isWhiteboardOpen}
        onToggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
        isInterviewActive={isInterviewActive}
        onInterviewToggle={() => setIsInterviewOpen(true)}
      />

      <InterviewMode
        roomId={roomId}
        currentUser={currentUser}
        isHost={currentUser?.isOwner}
        currentCode={code}
        language={language}
        isOpen={isInterviewOpen}
        onClose={() => setIsInterviewOpen(false)}
        socket={socket}
      />

      <Whiteboard
        roomId={roomId}
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
      />

      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <LeftPanel
              users={activeUsers}
              socket={socket}
              roomId={roomId}
              onAIReview={handleAIReview}
              onAIFix={handleAIFix}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Center Panel */}
          <ResizablePanel defaultSize={rightPanelView ? 55 : 80}>
            <CenterPanel
              roomId={roomId}
              code={code}
              onChange={handleCodeChange}
              language={language}
              users={activeUsers.filter((u) => !u.isCurrentUser)}
              currentUser={currentUser}
              saveStatus={saveStatus}
            />
          </ResizablePanel>

          {/* Right Panel */}
          {rightPanelView && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={50}>
                <RightPanel
                  view={rightPanelView}
                  output={output}
                  error={error}
                  input={input}
                  onInputChange={setInput}
                  isRunning={isRunning}
                  code={code}
                  language={language}
                  onClose={() => setRightPanelView(null)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
