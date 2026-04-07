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
import { initSocket } from "@/lib/socket";

import { toast } from "sonner";

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

  useEffect(() => {
    let isMounted = true;
    let localSocket = null;

    const initRoom = async () => {
      try {
        // 1. Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession();
        let userObj = null;
        if (session && isMounted) {
          userObj = {
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
          setLanguage(roomData.language || "javascript-node");

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
                color: isMe ? "#f97316" : "#3b82f6",
                isOnline: false, // Will be updated by socket events
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
          socket={socket}
          roomId={roomId}
          onAIReview={handleAIReview}
          onAIFix={handleAIFix}
        />

        <CenterPanel
          roomId={roomId}
          code={code}
          onChange={handleCodeChange}
          language={language}
          users={activeUsers.filter((u) => !u.isCurrentUser)}
          currentUser={currentUser}
          saveStatus={saveStatus}
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
