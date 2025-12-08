import { useEffect, useMemo, useState } from "react";
import { aiApi } from "../../services";
import styles from "./Ai.module.css";

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
  const [friendName, setFriendName] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [friendStats, setFriendStats] = useState({
    completionRate: 0,
    weeklyHours: 0,
  });

  useEffect(() => {
    loadFriends();
  }, []);

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

  const addFriend = async () => {
    if (!friendName.trim()) return;
    const payload = {
      displayName: friendName,
      email: friendEmail,
      completionRate: Number(friendStats.completionRate) || 0,
      weeklyHours: Number(friendStats.weeklyHours) || 0,
    };
    const saved = await aiApi.addFriend(payload);
    setFriends((prev) => [...prev, saved]);
    setFriendName("");
    setFriendEmail("");
    setFriendStats({ completionRate: 0, weeklyHours: 0 });
  };

  const compareFriends = async () => {
    if (!friends.length) return;
    setLoading(true);
    try {
      const data = await aiApi.compareFriends(friends);
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

      <div className={styles.layout}>
        <div className={styles.chatCard}>
          <div className={styles.messages}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`${styles.message} ${
                  m.role === "assistant" ? styles.assistant : styles.user
                }`}
              >
                {m.content}
              </div>
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

        <div className={styles.sideColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Insights</h3>
              <small>Latest AI suggestions</small>
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

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Friends</h3>
              <small>Compare progress</small>
            </div>
            <div className={styles.fieldRow}>
              <input
                placeholder="Name"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
              />
              <input
                placeholder="Email (optional)"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
              />
              <div className={styles.inlineFields}>
                <input
                  type="number"
                  placeholder="Completion %"
                  value={friendStats.completionRate}
                  onChange={(e) =>
                    setFriendStats((p) => ({
                      ...p,
                      completionRate: e.target.value,
                    }))
                  }
                />
                <input
                  type="number"
                  placeholder="Weekly hrs"
                  value={friendStats.weeklyHours}
                  onChange={(e) =>
                    setFriendStats((p) => ({
                      ...p,
                      weeklyHours: e.target.value,
                    }))
                  }
                />
              </div>
              <button className={styles.pill} onClick={addFriend}>
                + Add friend
              </button>
            </div>
            <ul className={styles.friendList}>
              {friends.map((f) => (
                <li key={f.id}>
                  <div>
                    <strong>{f.displayName}</strong>
                    <p className={styles.muted}>
                      {f.completionRate}% · {f.weeklyHours}h/wk
                    </p>
                  </div>
                  <button
                    className={styles.linkBtn}
                    onClick={async () => {
                      await aiApi.deleteFriend(f.id);
                      setFriends((prev) => prev.filter((x) => x.id !== f.id));
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {!friends.length && (
                <li className={styles.muted}>No friends yet.</li>
              )}
            </ul>
            <button
              className={styles.primaryBtn}
              onClick={compareFriends}
              disabled={!friends.length}
            >
              Compare with AI
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Ai;
