import { useState, useEffect } from "react";
import styles from "./Profile.module.css";
import api from "../../services/api";

function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [studySpeed, setStudySpeed] = useState("normal");
  const [maxSession, setMaxSession] = useState("60");
  const [weeklyLimit, setWeeklyLimit] = useState(10);

  // Load dark mode from localStorage on mount
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [originalData, setOriginalData] = useState(null);

  // Apply dark mode class to document when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Load profile data on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await api.getProfile();
      setName(profile.fullName || "");
      setEmail(profile.email || "");
      setStudySpeed(profile.studySpeed || "normal");
      setMaxSession(String(profile.maxSessionMinutes || 60));
      setWeeklyLimit(profile.weeklyLimitHours || 10);
      const isDark = profile.darkMode || false;
      setDarkMode(isDark);
      setOriginalData(profile);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleDarkModeToggle = () => {
    setDarkMode((prev) => !prev);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      await api.updateProfile({
        fullName: name,
        studySpeed: studySpeed,
        maxSessionMinutes: parseInt(maxSession) || 60,
        weeklyLimitHours: weeklyLimit,
        darkMode: darkMode,
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
      
      // Reload profile to get updated data
      await loadProfile();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!oldPass || !newPass || !confirmPass) {
      setMessage({ type: "error", text: "Please fill in all password fields" });
      return;
    }

    if (newPass !== confirmPass) {
      setMessage({ type: "error", text: "New password and confirm password do not match" });
      return;
    }

    if (newPass.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }

    try {
      setPasswordLoading(true);
      setMessage({ type: "", text: "" });

      await api.changePassword(oldPass, newPass);

      setMessage({ type: "success", text: "Password changed successfully!" });
      
      // Clear password fields
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to change password" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDiscard = () => {
    if (originalData) {
      setName(originalData.fullName || "");
      setEmail(originalData.email || "");
      setStudySpeed(originalData.studySpeed || "normal");
      setMaxSession(String(originalData.maxSessionMinutes || 60));
      setWeeklyLimit(originalData.weeklyLimitHours || 10);
      setDarkMode(originalData.darkMode || false);
    }
    setOldPass("");
    setNewPass("");
    setConfirmPass("");
    setMessage({ type: "", text: "" });
  };

  if (loading && !originalData) {
    return (
      <section className={styles.profile}>
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.kicker}>Account</p>
            <h1>Your profile</h1>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-soft)" }}>
          Loading profile...
        </div>
      </section>
    );
  }

  return (
    <section className={styles.profile}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Account</p>
          <h1>Your profile</h1>
        </div>
      </div>

      {message.text && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "4px",
            backgroundColor: message.type === "error" ? "#fee" : "#efe",
            color: message.type === "error" ? "#c33" : "#3c3",
            border: `1px solid ${message.type === "error" ? "#c33" : "#3c3"}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.kicker}>Basics</p>
            <h2>User information</h2>
          </div>

          <label>
            Full Name
            <input
              type="text"
              value={name}
              placeholder="Your name"
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              value={email}
              placeholder="Your email"
              readOnly
              style={{ backgroundColor: "var(--surface)", cursor: "not-allowed", opacity: 0.7 }}
            />
          </label>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.kicker}>Security</p>
            <h2>Password</h2>
          </div>

          <label>
            Current Password
            <input
              type="password"
              value={oldPass}
              placeholder="••••••••"
              onChange={(e) => setOldPass(e.target.value)}
              disabled={passwordLoading}
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              value={newPass}
              placeholder="••••••••"
              onChange={(e) => setNewPass(e.target.value)}
              disabled={passwordLoading}
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPass}
              placeholder="••••••••"
              onChange={(e) => setConfirmPass(e.target.value)}
              disabled={passwordLoading}
            />
          </label>

          <button
            className={styles.dangerBtn}
            type="button"
            onClick={handlePasswordChange}
            disabled={passwordLoading || !oldPass || !newPass || !confirmPass}
          >
            {passwordLoading ? "Updating..." : "Update password"}
          </button>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.kicker}>Preferences</p>
            <h2>Study pacing</h2>
          </div>

          <label>
            Preferred Study Speed
            <select
              value={studySpeed}
              onChange={(e) => setStudySpeed(e.target.value)}
              disabled={loading}
            >
              <option value="slow">Slow & Deep</option>
              <option value="normal">Balanced</option>
              <option value="fast">Fast Paced</option>
            </select>
          </label>

          <label>
            Max Session Time (minutes)
            <input
              value={maxSession}
              onChange={(e) => setMaxSession(e.target.value)}
              type="number"
              placeholder="60"
              disabled={loading}
            />
          </label>

          <label className={styles.rangeLabel}>
            Weekly Study Limit: <strong>{weeklyLimit} hrs</strong>
            <input
              type="range"
              min="1"
              max="40"
              value={weeklyLimit}
              onChange={(e) => setWeeklyLimit(Number(e.target.value))}
              disabled={loading}
            />
          </label>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.kicker}>Display</p>
            <h2>Theme</h2>
          </div>

          <div className={styles.toggleRow}>
            <div>
              <p>Dark mode</p>
              <small>Great for late study sessions.</small>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={handleDarkModeToggle}
                disabled={loading}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.displayNote}>
            <span />
            <p>UI adapts automatically to device preferences.</p>
          </div>
        </section>
      </div>

      <div className={styles.actionsRow}>
        <button
          className={styles.secondaryBtn}
          type="button"
          onClick={handleDiscard}
          disabled={loading}
        >
          Discard changes
        </button>
        <button
          className={styles.primaryBtn}
          type="button"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save all"}
        </button>
      </div>
    </section>
  );
}

export default Profile;
