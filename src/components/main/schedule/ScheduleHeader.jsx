import React from "react";
import styles from "../Schedule.module.css";

export function ScheduleHeader({ onAutoSchedule, onReset, loading }) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <p className={styles.kicker}>AI-powered scheduling</p>
        <h1>Study planner</h1>
        <p className={styles.subtle}>
          Intelligent time blocking for optimal learning outcomes
        </p>
      </div>

      <div className={styles.controls}>
        <button
          className={styles.primaryBtn}
          type="button"
          onClick={onAutoSchedule}
          disabled={loading}
        >
          🚀 Auto-schedule modules
        </button>

        <button
          className={styles.secondaryBtn}
          type="button"
          onClick={onReset}
          disabled={loading}
        >
          🧹 Reset schedule
        </button>
      </div>
    </div>
  );
}
