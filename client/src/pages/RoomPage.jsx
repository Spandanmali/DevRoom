import { useState } from "react";
import { useParams } from "react-router-dom";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { LeftPanel } from "@/components/editor/left-panel";
import { CenterPanel } from "@/components/editor/center-panel";
import { RightPanel } from "@/components/editor/right-panel";
import { RightPanelToggle } from "@/components/editor/right-panel-toggle";
import { VoiceBar } from "@/components/editor/voice-bar";

const MOCK_USERS = [
  { id: "1", name: "Arjun", color: "#3b82f6", isOnline: true },
  { id: "2", name: "Priya", color: "#a855f7", isOnline: true },
  {
    id: "3",
    name: "You",
    color: "#f97316",
    isOnline: true,
    isCurrentUser: true,
  },
];

const MOCK_MESSAGES = [
  {
    id: "1",
    userId: "1",
    username: "Arjun",
    color: "#3b82f6",
    message: "Hey, I just pushed the fix for the API",
    time: "2:34 PM",
  },
  {
    id: "2",
    userId: "2",
    username: "Priya",
    color: "#a855f7",
    message: "Nice! Let me review it",
    time: "2:35 PM",
  },
];

const SAMPLE_CODE = `// Real-time collaborative code editor
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Example usage
const result = fibonacci(10);
console.log(\`Fibonacci(10) = \${result}\`);

// Array manipulation
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

// Async function example
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
`;

export default function RoomPage() {
  const { roomId = "room" } = useParams();
  const [roomName, setRoomName] = useState("Untitled Project");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(SAMPLE_CODE);
  const [rightPanelView, setRightPanelView] = useState(null);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [input, setInput] = useState("");

  const handleRunCode = () => {
    setIsRunning(true);
    setRightPanelView("output");
    setOutput("");
    setError("");

    setTimeout(() => {
      setOutput("Fibonacci(10) = 55\nDoubled: [2, 4, 6, 8, 10]");
      setIsRunning(false);
    }, 1500);
  };

  const handleSendMessage = (message) => {
    const newMessage = {
      id: Date.now().toString(),
      userId: "3",
      username: "You",
      color: "#f97316",
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

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <EditorNavbar
        roomId={roomId}
        roomName={roomName}
        onRoomNameChange={setRoomName}
        language={language}
        onLanguageChange={setLanguage}
        users={MOCK_USERS}
        onRun={handleRunCode}
        isRunning={isRunning}
      />

      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          users={MOCK_USERS}
          messages={messages}
          onSendMessage={handleSendMessage}
          onAIReview={handleAIReview}
          onAIFix={handleAIFix}
        />

        <CenterPanel
          code={code}
          onChange={setCode}
          language={language}
          users={MOCK_USERS.filter((u) => !u.isCurrentUser)}
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

      <VoiceBar users={MOCK_USERS} />
    </div>
  );
}
