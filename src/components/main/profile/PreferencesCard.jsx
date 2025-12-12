import React from "react";
import styles from "../Profile.module.css";

export function PreferencesCard({ preferences, saving, onChange, onSubmit }) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.kicker}>Study</p>
        <h2>Learning preferences</h2>
      </div>

      <form onSubmit={onSubmit}>
        <label>
          Preferred Study Speed
          <select
            value={preferences.studySpeed}
            onChange={(e) => onChange({ studySpeed: e.target.value })}
          >
            <option value="slow">Slow & Deep</option>
            <option value="normal">Balanced</option>
            <option value="fast">Fast Paced</option>
          </select>
        </label>

        <label>
          Max Session Time (minutes)
          <input
            value={preferences.maxSessionMinutes}
            onChange={(e) =>
              onChange({ maxSessionMinutes: Number(e.target.value) })
            }
            type="number"
            min="15"
            max="240"
            placeholder="60"
          />
        </label>

        <label className={styles.rangeLabel}>
          Weekly Study Limit:{" "}
          <strong>{preferences.weeklyStudyLimitHours} hrs</strong>
          <input
            type="range"
            min="1"
            max="40"
            value={preferences.weeklyStudyLimitHours}
            onChange={(e) =>
              onChange({ weeklyStudyLimitHours: Number(e.target.value) })
            }
          />
        </label>

        <div className={styles.cardActions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? "Updating..." : "Update Preferences"}
          </button>
        </div>
      </form>
    </section>
  );
}
