import styles from "./ProgressCard.module.css";

function ProgressCard({ totalHours, hoursRemaining }) {
  const progress =
    totalHours > 0 ? ((totalHours - hoursRemaining) / totalHours) * 100 : 0;
  const hoursDone = totalHours - hoursRemaining;

  return (
    <div className={styles.card}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.value}>{Math.round(progress)}%</div>
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

      <div className={styles.barContainer}>
        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.text}>
          <span className={styles.percent}>{Math.round(progress)}%</span>
          <span className={styles.details}>{hoursRemaining}h remaining</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressCard;
