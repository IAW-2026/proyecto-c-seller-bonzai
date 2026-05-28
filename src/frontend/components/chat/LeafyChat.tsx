"use client";

import { useState, useRef, useEffect } from "react";
import { Leaf, X, Send, Loader2 } from "lucide-react";
import styles from "./LeafyChat.module.css";

interface Message {
  role: "user" | "leafy";
  text: string;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

const WELCOME: Message = { role: "leafy", text: "Hi! I'm Leafy 🌿. Ask me anything about plants!" };

export function LeafyChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [WELCOME];
    try {
      const saved = sessionStorage.getItem("leafy_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [WELCOME];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem("leafy_messages", JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "leafy", text: data.reply || "Sorry, I couldn't process that." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "leafy", text: "Something went wrong. Try again!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className={styles.fab} onClick={() => setOpen((o) => !o)} title="Ask Leafy">
        {open ? <X size={20} /> : <Leaf size={20} />}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <Leaf size={16} />
            <span>Leafy</span>
          </div>
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.role === "leafy" ? styles.leafyMsg : styles.userMsg}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
              />
            ))}
            {loading && (
              <div className={styles.leafyMsg}>
                <Loader2 size={12} className={styles.spinner} /> Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Ask about plants..."
              disabled={loading}
            />
            <button className={styles.sendBtn} onClick={handleSend} disabled={loading || !input.trim()}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
