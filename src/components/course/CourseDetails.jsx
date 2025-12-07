import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaClock,
  FaBook,
  FaStickyNote,
  FaLink,
  FaCog,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { courseApi } from "../../services";
import ModuleTree from "./ModuleTree";
import ExternalLinks from "./ExternalLinks";
import ProgressCard from "./ProgressCard";
import EditCourseModal from "./EditCourseModal";
import styles from "./CourseDetails.module.css";

function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTime, setActiveTime] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  useEffect(() => {
    if (!course) return;

    intervalRef.current = setInterval(() => {
      setActiveTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        if (activeTime > 0) {
          courseApi.updateCourseActiveTime(id, activeTime / 3600);
        }
      }
    };
  }, [course, id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const data = await courseApi.getCourse(id);
      setCourse(data);
      setNoteDraft(data.notes || "");
      setActiveTime(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (updates) => {
    try {
      await courseApi.updateCourse(id, updates);
      setCourse((prev) => ({ ...prev, ...updates }));
      setShowEditModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setError("");
    try {
      await courseApi.updateCourse(id, { notes: noteDraft });
      setCourse((prev) => (prev ? { ...prev, notes: noteDraft } : prev));
      setEditingNotes(false);
    } catch (err) {
      setError(err.message || "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error && !course) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          onClick={() => navigate("/app/course")}
          className={styles.backBtn}
        >
          <FaArrowLeft /> Back
        </button>

        <div className={styles.title}>
          <h1>{course.title}</h1>
          <div className={styles.meta}>
            <span
              className={`${styles.badge} ${
                styles[course.difficulty?.toLowerCase()]
              }`}
            >
              {course.difficulty}
            </span>
            <span
              className={`${styles.badge} ${
                styles[course.priority?.toLowerCase()]
              }`}
            >
              {course.priority}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.timer}>
            <FaClock /> {formatTime(activeTime)}
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className={styles.editBtn}
          >
            <FaCog /> Edit
          </button>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.content}>
        <main className={styles.main}>
          <section className={styles.section}>
            <h2>
              <FaBook /> Course Modules
            </h2>
            <ModuleTree
              modules={course.modules || []}
              onUpdate={async (moduleId, updates) => {
                await courseApi.updateModule(moduleId, updates);
                fetchCourse();
              }}
              onToggleCompletion={async (moduleId) => {
                await courseApi.toggleModuleCompletion(moduleId);
                fetchCourse();
              }}
              onAdd={async (payload) => {
                await courseApi.createModule(id, payload);
                fetchCourse();
              }}
            />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>
                <FaStickyNote /> Notes
              </h2>
              <div className={styles.noteActions}>
                {editingNotes ? (
                  <>
                    <button
                      className={styles.noteBtnPrimary}
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                    >
                      <FaSave /> {savingNotes ? "Saving..." : "Save"}
                    </button>
                    <button
                      className={styles.noteBtnGhost}
                      onClick={() => {
                        setEditingNotes(false);
                        setNoteDraft(course?.notes || "");
                      }}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className={styles.noteBtnGhost}
                    onClick={() => setEditingNotes(true)}
                  >
                    <FaEdit /> Edit
                  </button>
                )}
              </div>
            </div>

            {editingNotes ? (
              <div className={styles.notesEditor}>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={8}
                  placeholder="Write notes in Markdown..."
                />
                <p className={styles.noteHint}>
                  Markdown supported (bold, lists, links).
                </p>
              </div>
            ) : (
              <div className={styles.notePreview}>
                {noteDraft?.trim() ? (
                  <ReactMarkdown>{noteDraft}</ReactMarkdown>
                ) : (
                  <p className={styles.notesEmpty}>
                    No notes yet. Click Edit to add some.
                  </p>
                )}
              </div>
            )}
          </section>
        </main>

        <aside className={styles.sidebar}>
          <section className={styles.section}>
            <h2>
              <FaClock /> Progress
            </h2>
            <ProgressCard
              totalHours={course.totalEstimatedHours}
              hoursRemaining={course.hoursRemaining}
            />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>
                <FaLink /> Resources
              </h2>
              <button
                onClick={async () => {
                  await courseApi.addExternalLink(id, {
                    platform: "Website",
                    title: "",
                    url: "",
                  });
                  fetchCourse();
                }}
                className={styles.addBtn}
              >
                +
              </button>
            </div>
            <ExternalLinks
              links={course.externalLinks || []}
              onUpdate={async (linkId, updates) => {
                await courseApi.updateExternalLink(linkId, updates);
                fetchCourse();
              }}
              onDelete={async (linkId) => {
                await courseApi.deleteExternalLink(linkId);
                fetchCourse();
              }}
            />
          </section>
        </aside>
      </div>

      {showEditModal && (
        <EditCourseModal
          course={course}
          onSave={handleUpdateCourse}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

export default CourseDetails;
