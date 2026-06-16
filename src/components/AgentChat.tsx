import React, { useState, useRef, useEffect } from 'react';

import ReactMarkdown from 'react-markdown';


// Explicitly define the shape of our chat history state
interface Message {
    text: string;
    sender: 'user' | 'bot';
}

export default function AgentChat() {
    const [messages, setMessages] = useState<Message[]>([
        { text: "Hello! I am Edrick your AI Assistant. How can I assist you today?", sender: "bot" }
    ]);
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [docFilename, setDocFilename] = useState<string | null>(null);

    // Type the reference to explicitly point to an HTML div element
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Update this with your live Render URL
    const BACKEND_URL = "https://aiagent-mnra.onrender.com";

    const scrollToBottom = (): void => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput("");

        setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
        setIsLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            if (response.status === 429) throw new Error("rate_limited");
            if (!response.ok) throw new Error("Server error or timeout.");

            const data = await response.json() as { reply: string };

            // Extract filename from agent reply e.g. "Saved as John_Doe_CV.docx"
            const filenameMatch = data.reply.match(/Saved as ([^\s]+\.docx)/i);
            if (filenameMatch) {
                setDocFilename(filenameMatch[1]);
            }

            setMessages((prev) => [...prev, { text: data.reply, sender: "bot" }]);
        } catch (error) {
            let errorText = "⚠️ Something went wrong. Please try again in a moment.";

            if (error instanceof Error) {
                if (error.message === "rate_limited") {
                    errorText = "⚠️ Rate limit reached. Please wait 30 seconds and try again.";
                } else if (error.message === "server_error") {
                    errorText = "⚠️ The agent encountered an error. If you just generated a document, wait 30 seconds before making another request.";
                }
            }

            console.error("Connection error:", error);
            setMessages((prev) => [...prev, { text: errorText, sender: "bot" }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Format filename for display: "John_Doe_Cover_Letter.docx" → "John Doe Cover Letter"
    const formatDocLabel = (filename: string): string => {
        return filename.replace(/_/g, " ").replace(".docx", "");
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2>🤖 Write CVs, Resumes & Cover Letters and Make Research</h2>
                {/* <span style={styles.statusBadge}>● Backend Live</span> */}
            </header>

            <div style={styles.chatWindow}>
                {messages.map((msg, index) => (
                    <div key={index} style={msg.sender === "user" ? styles.userRow : styles.botRow}>
                        <div style={msg.sender === "user" ? styles.userBubble : styles.botBubble}>
                            {msg.sender === "bot" ? (
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            ) : (
                                msg.text
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={styles.botRow}>
                        <div style={styles.loaderBubble}>
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                    placeholder="Ask your agent to process structural data or documents..."
                    style={styles.inputField}
                    disabled={isLoading}
                />
                <button type="submit" style={styles.sendButton} disabled={isLoading}>
                    {isLoading ? "..." : "Send"}
                </button>
            </form>

            <footer style={styles.downloadTray}>
                <span style={{ fontSize: "14px", color: "#555" }}>Assets:</span>
                {docFilename ? (
                    <a
                        href={`${BACKEND_URL}/download/${docFilename}`}
                        download
                        style={styles.downloadButton}
                        onClick={(e: React.MouseEvent) => {
                            if (isLoading) e.preventDefault();
                        }}
                    >
                        📄 Download {formatDocLabel(docFilename)}
                    </a>
                ) : (
                    <span style={styles.noDocText}>
                        No document generated yet.
                    </span>
                )}
            </footer>
        </div>
    );
}

// Map styles to strict React CSS properties type mappings
const styles: Record<string, React.CSSProperties> = {
    container: { maxWidth: "800px", margin: "30px auto", border: "1px solid #e0e0e0", borderRadius: "12px", display: "flex", flexDirection: "column", height: "80vh", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontFamily: "system-ui, sans-serif" },
    header: { padding: "15px 20px", borderBottom: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f9f9f9", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" },
    statusBadge: { backgroundColor: "#e6f4ea", color: "#137333", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" },
    chatWindow: { flex: 1, padding: "20px", overflowY: "auto", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "12px" },
    userRow: { display: "flex", justifyContent: "flex-end" },
    botRow: { display: "flex", justifyContent: "flex-start" },
    userBubble: { backgroundColor: "#0070f3", color: "#fff", padding: "12px 16px", borderRadius: "18px", borderBottomRightRadius: "4px", maxWidth: "70%", fontSize: "15px", lineHeight: "1.4" },
    botBubble: { backgroundColor: "#f1f3f4", color: "#202124", padding: "12px 16px", borderRadius: "18px", borderBottomLeftRadius: "4px", maxWidth: "70%", fontSize: "15px", lineHeight: "1.4" },
    loaderBubble: { backgroundColor: "#fffde7", color: "#f57f17", padding: "10px 14px", borderRadius: "12px", border: "1px dashed #fbc02d", fontSize: "14px" },
    inputArea: { display: "flex", borderTop: "1px solid #e0e0e0", padding: "12px" },
    inputField: { flex: 1, padding: "12px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "15px", outline: "none" },
    sendButton: { marginLeft: "10px", padding: "0 20px", backgroundColor: "#0070f3", color: "#fff", border: "none", borderRadius: "6px", fontSize: "15px", cursor: "pointer" },
    downloadTray: { padding: "12px 20px", backgroundColor: "#f1f3f4", borderTop: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" },
    downloadButton: { display: "inline-block", padding: "8px 14px", backgroundColor: "#34a853", color: "#fff", textDecoration: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "500" },
    noDocText: { fontSize: "13px", color: "#999", fontStyle: "italic" }
};
