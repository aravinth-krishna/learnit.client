import styles from "./ProgressCard.module.css";

function ProgressCard({
  progressPercentage,
  completedModules,
  totalModules,
  totalHours,
  completedHours,
  hoursRemaining,
}) {
  const derivedProgress =
    progressPercentage ??
    (totalHours > 0 ? ((totalHours - hoursRemaining) / totalHours) * 100 : 0);

  const hoursDone =
    completedHours ?? Math.max(0, totalHours - (hoursRemaining ?? 0));

  return (
    <div className={styles.card}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.value}>{Math.round(derivedProgress)}%</div>
          <div className={styles.label}>Complete</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.value}>{hoursDone}</div>
          <div className={styles.label}>Hours Done</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.value}>{hoursRemaining}</div>
          <div className={styles.label}>Hours Left</div>
        </div>
      </div>

      {typeof totalModules === "number" && (
        <div className={styles.modulesRow}>
          <span className={styles.modulesLabel}>Modules</span>
          <span className={styles.modulesValue}>
            {completedModules ?? 0}/{totalModules}
          </span>
        </div>
      )}

      <div className={styles.barContainer}>
        <div className={styles.bar}>
          <div
            className={styles.fill}
            style={{ width: `${Math.min(100, derivedProgress)}%` }}
          />
        </div>
        <div className={styles.text}>
          <span className={styles.percent}>{Math.round(derivedProgress)}%</span>
          <span className={styles.details}>{hoursRemaining}h remaining</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressCard;
