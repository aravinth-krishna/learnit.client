import { FaPlay, FaEdit, FaTrash } from "react-icons/fa";
import styles from "./CourseCard.module.css";

function CourseCard({ course, onNavigate, onEdit, onDelete }) {
  const {
    id,
    title,
    description,
    hoursRemaining,
    totalEstimatedHours,
    priority,
    difficulty,
  } = course;

  const progress =
    totalEstimatedHours > 0
      ? ((totalEstimatedHours - hoursRemaining) / totalEstimatedHours) * 100
      : 0;

  const handlePlay = (e) => {
    e.stopPropagation();
    onNavigate(id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm("Delete this course?")) {
      onDelete(id);
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.image}>
          <div className={styles.placeholder}>
            <span>{title.charAt(0).toUpperCase()}</span>
          </div>
          <button
            className={styles.playBtn}
            onClick={handlePlay}
            title="Open Course"
          >
            <FaPlay />
          </button>
        </div>

        <div className={styles.badges}>
          {priority && (
            <span
              className={`${styles.badge} ${styles[priority.toLowerCase()]}`}
            >
              {priority}
            </span>
          )}
          {difficulty && (
            <span
              className={`${styles.badge} ${styles[difficulty.toLowerCase()]}`}
            >
              {difficulty}
            </span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description || "No description"}</p>

        <div className={styles.progress}>
          <div className={styles.bar}>
            <div className={styles.fill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.text}>
            <span className={styles.percent}>{Math.round(progress)}%</span>
            <span className={styles.remaining}>{hoursRemaining}h left</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.continueBtn} onClick={handlePlay}>
            <FaPlay /> Continue
          </button>
          <div className={styles.icons}>
            <button
              className={styles.iconBtn}
              onClick={handleEdit}
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              className={styles.iconBtn}
              onClick={handleDelete}
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default CourseCard;
