import { useEffect, useMemo, useState } from "react";
import { aiApi } from "../../services";
import styles from "./Ai.module.css";

const escapeHtml = (str) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const applyInlineMarkdown = (text) =>
  text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

const markdownToHtml = (text) => {
  const escaped = escapeHtml(text || "");
  const lines = escaped.split(/\r?\n/);
  const html = [];
  let inList = false;

  for (const line of lines) {
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      const item = line.replace(/^\s*[-*]\s+/, "");
      html.push(`<li>${applyInlineMarkdown(item)}</li>`);
    } else if (line.trim().length) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<p>${applyInlineMarkdown(line)}</p>`);
    }
  }

  if (inList) html.push("</ul>");
  return html.join("") || "<p></p>";
};

function Ai() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey! Ask me about courses, scheduling, or progress.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    setSelectedFriendIds((prev) =>
      prev.filter((id) => friends.some((f) => f.id === id))
    );
  }, [friends]);

  const userHistory = useMemo(
    () =>
      messages
        .filter((m) => m.role !== "assistant")
        .map((m) => ({ role: "user", content: m.content })),
    [messages]
  );

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const reply = await aiApi.chat({ message: text, history: userHistory });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err.message || "AI request failed" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickInsights = async (type) => {
    setLoading(true);
    try {
      const apiCall =
        type === "schedule"
          ? aiApi.scheduleInsights
          : type === "progress"
          ? aiApi.progressInsights
          : aiApi.scheduleInsights;
      const data = await apiCall();
      setInsights(data.insights || []);
    } catch (err) {
      setInsights([{ title: "Error", detail: err.message || "Failed" }]);
    } finally {
      setLoading(false);
    }
  };

  const generateCourse = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const draft = await aiApi.createCourse(input.trim());
      const summary = `${draft.title} | ${draft.modules.length} modules | ${draft.totalEstimatedHours}h`;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Drafted course: " + summary },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err.message || "Failed to generate course",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const data = await aiApi.listFriends();
      setFriends(data);
    } catch (err) {
      // silent
    }
  };

  const compareFriends = async () => {
    if (!selectedFriendIds.length) return;
    setLoading(true);
    try {
      const data = await aiApi.compareFriends(selectedFriendIds);
      setInsights(data.insights || []);
    } catch (err) {
      setInsights([
        { title: "Error", detail: err.message || "Compare failed" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>AI Workspace</p>
          <h1>Assistant</h1>
          <p className={styles.subtle}>
            Chat, generate courses, get scheduling and progress insights.
          </p>
        </div>
        <div className={styles.quickRow}>
          <button
            className={styles.pill}
            onClick={() => quickInsights("schedule")}
          >
            ⚡ Schedule insights
          </button>
          <button
            className={styles.pill}
            onClick={() => quickInsights("progress")}
          >
            📊 Progress tips
          </button>
          <button
            className={styles.pill}
            onClick={generateCourse}
            disabled={!input}
          >
            🛠️ Generate course
          </button>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "chat" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("chat")}
        >
          Chat
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "compare" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("compare")}
        >
          Insights & Friends
        </button>
      </div>

      {activeTab === "chat" && (
        <div className={styles.layout}>
          <div className={styles.chatCard}>
            <div className={styles.messages}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`${styles.message} ${
                    m.role === "assistant" ? styles.assistant : styles.user
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: markdownToHtml(m.content),
                  }}
                ></div>
              ))}
              {loading && <div className={styles.message}>Thinking...</div>}
            </div>
            <div className={styles.inputRow}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your study plan..."
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "compare" && (
        <div className={styles.compareGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Select a friend</h3>
              <small>We’ll compare them with your progress</small>
            </div>
            <ul className={styles.friendList}>
              {friends.map((f) => (
                <li key={f.id}>
                  <label className={styles.friendRow}>
                    <input
                      type="radio"
                      name="friendCompare"
                      checked={selectedFriendIds.includes(f.id)}
                      onChange={() => setSelectedFriendIds([f.id])}
                    />
                    <div>
                      <strong>{f.displayName}</strong>
                      <p className={styles.muted}>
                        {f.completionRate}% · {f.weeklyHours}h/wk · {f.email}
                      </p>
                    </div>
                  </label>
                </li>
              ))}
              {!friends.length && (
                <li className={styles.muted}>
                  No friends yet. Add them from Profile → Friends.
                </li>
              )}
            </ul>
            <button
              className={styles.primaryBtn}
              onClick={compareFriends}
              disabled={!selectedFriendIds.length}
            >
              Compare with AI
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Insights</h3>
              <small>User vs selected friend</small>
            </div>
            <ul className={styles.insightList}>
              {insights.map((ins, i) => (
                <li key={i}>
                  <strong>{ins.title}</strong>
                  <p>{ins.detail}</p>
                </li>
              ))}
              {!insights.length && (
                <li className={styles.muted}>No insights yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

export default Ai;
