import { useState } from "react";
import styles from "./Profile.module.css";

function Profile() {
  const [name, setName] = useState("Aravinth Krishna");
  const [email, setEmail] = useState("aravinth@example.com");

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [studySpeed, setStudySpeed] = useState("normal");
  const [maxSession, setMaxSession] = useState("60");
  const [weeklyLimit, setWeeklyLimit] = useState(10);

  const [darkMode, setDarkMode] = useState(false);

  const handleSave = () => {
    alert("Profile updated successfully!");
  };

  return (
    <section className={styles.profile}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Account</p>
          <h1>Your profile</h1>
        </div>
      </div>

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
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              value={email}
              placeholder="Your email"
              onChange={(e) => setEmail(e.target.value)}
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
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              value={newPass}
              placeholder="••••••••"
              onChange={(e) => setNewPass(e.target.value)}
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPass}
              placeholder="••••••••"
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </label>

          <button className={styles.dangerBtn} type="button">
            Update password
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
                onChange={() => setDarkMode((prev) => !prev)}
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
        <button className={styles.secondaryBtn} type="button">
          Discard changes
        </button>
        <button
          className={styles.primaryBtn}
          type="button"
          onClick={handleSave}
        >
          Save all
        </button>
      </div>
    </section>
  );
}

export default Profile;
