import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

const Chat = ({ socket, roomId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!socket) return;

    const handleLoadMessages = (loadedMessages) => {
      setMessages(loadedMessages);
      scrollToBottom();
    };

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    };

    socket.on("load-messages", handleLoadMessages);
    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("load-messages", handleLoadMessages);
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit("send-message", { roomId, message: newMessage.trim() });
    setNewMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-3">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Chat
      </h3>

      <ScrollArea className="flex-1 -mx-3 px-3">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs mt-4">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg, index) => {
              const isCurrentUser = msg.user_id === currentUser?.id;
              
              return (
                <div 
                  key={index} 
                  className={`flex flex-col text-sm ${isCurrentUser ? "items-end" : "items-start"}`}
                >
                  <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                    <span className="font-medium text-foreground text-xs">
                      {isCurrentUser ? "You" : msg.username}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  
                  <div 
                    className={`max-w-[85%] px-3 py-2 rounded-2xl break-words ${
                      isCurrentUser 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-secondary text-secondary-foreground dark:bg-zinc-800 bg-zinc-200 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 mt-3">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 h-8 bg-input border-border text-foreground text-sm placeholder:text-muted-foreground"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="h-8 w-8 hover:bg-accent"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chat;
