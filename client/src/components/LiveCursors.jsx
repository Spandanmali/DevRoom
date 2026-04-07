import React, { useEffect, useState } from "react";

const LiveCursors = ({ awareness, editor }) => {
  const [cursors, setCursors] = useState([]);

  useEffect(() => {
    if (!awareness || !editor) return;

    const handleAwarenessUpdate = () => {
      const states = Array.from(awareness.getStates().entries());
      const newCursors = [];

      states.forEach(([clientId, state]) => {
        // Skip our own cursor
        if (clientId === awareness.clientID) return;

        const customCursor = state.customCursor;
        if (customCursor && customCursor.position && customCursor.user) {
          try {
            // Get visible screen position for the line/col
            const pos = editor.getScrolledVisiblePosition(
              customCursor.position,
            );
            if (pos) {
              newCursors.push({
                clientId,
                top: pos.top,
                left: pos.left,
                height: pos.height,
                user: customCursor.user,
              });
            }
          } catch (e) {
            // Ignore errors if position is invalid or editor not fully ready
          }
        }
      });

      setCursors(newCursors);
    };

    awareness.on("change", handleAwarenessUpdate);
    editor.onDidScrollChange(handleAwarenessUpdate);
    editor.onDidChangeModelContent(handleAwarenessUpdate);

    return () => {
      awareness.off("change", handleAwarenessUpdate);
    };
  }, [awareness, editor]);

  return (
    <>
      {cursors.map((cursor) => (
        <div
          key={cursor.clientId}
          style={{
            position: "absolute",
            top: cursor.top,
            left: cursor.left,
            height: cursor.height,
            width: "2px",
            backgroundColor: cursor.user.color || "blue",
            zIndex: 10,
            pointerEvents: "none",
            transition: "top 0.1s, left 0.1s",
          }}
        >
          {/* Username label above cursor */}
          <div
            style={{
              position: "absolute",
              top: "-20px",
              left: "0px",
              backgroundColor: cursor.user.color || "blue",
              color: "white",
              fontSize: "12px",
              padding: "2px 6px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
            }}
          >
            {cursor.user.name}
          </div>
        </div>
      ))}
    </>
  );
};

export default LiveCursors;
