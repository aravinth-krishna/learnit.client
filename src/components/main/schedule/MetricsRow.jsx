import React from "react";
import styles from "../Schedule.module.css";

export function MetricsRow({ weeklyGoal, completedThisWeek }) {
  return (
    <div className={styles.metricsRow}>
      <div className={styles.metricCard}>
        <span>Weekly Goal</span>
        <strong>{weeklyGoal}</strong>
      </div>
      <div className={styles.metricCard}>
        <span>Completed</span>
        <strong>{completedThisWeek}</strong>
      </div>
    </div>
  );
}
