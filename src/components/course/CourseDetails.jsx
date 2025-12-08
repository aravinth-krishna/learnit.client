import { useEffect, useMemo, useState } from "react";
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
import Button from "../ui/Button";
import ui from "../ui/ui.module.css";
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const data = await courseApi.getCourse(id);
      setCourse(data);
      setNoteDraft(data.notes || "");
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

  const moduleTotals = () => {
    const flat = flatModules;
    const total = flat.length;
    const completed = flat.filter((m) => m.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  };

  const flatModules = useMemo(() => {
    if (!course?.modules) return [];
    const roots = course.modules || [];
    const result = [];
    roots.forEach((root) => {
      result.push({ ...root, parentModuleId: null });
      (root.subModules || []).forEach((sub) => {
        result.push({ ...sub, parentModuleId: root.id });
      });
    });
    return result;
  }, [course]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error && !course) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Button variant="ghost" onClick={() => navigate("/app/course")}>
          <FaArrowLeft /> Back
        </Button>

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
            <FaClock /> {moduleTotals().completed}/{moduleTotals().total}{" "}
            modules · {moduleTotals().percent}%
          </div>
          <Button variant="primary" onClick={() => setShowEditModal(true)}>
            <FaCog /> Edit
          </Button>
        </div>
      </header>

      {error && <div className={ui.errorBanner}>{error}</div>}

      <div className={styles.content}>
        <main className={styles.main}>
          <section className={styles.section}>
            <h2>
              <FaBook /> Course Modules
            </h2>
            <ModuleTree
              modules={flatModules}
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
                    <Button
                      variant="primary"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                    >
                      <FaSave /> {savingNotes ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingNotes(false);
                        setNoteDraft(course?.notes || "");
                      }}
                    >
                      <FaTimes /> Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" onClick={() => setEditingNotes(true)}>
                    <FaEdit /> Edit
                  </Button>
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
              progressPercentage={course.progressPercentage}
              completedModules={course.completedModules}
              totalModules={course.totalModules}
              totalHours={course.totalEstimatedHours}
              completedHours={course.completedHours}
              hoursRemaining={course.hoursRemaining}
            />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>
                <FaLink /> Resources
              </h2>
              <Button
                variant="primary"
                onClick={async () => {
                  await courseApi.addExternalLink(id, {
                    platform: "Website",
                    title: "",
                    url: "",
                  });
                  fetchCourse();
                }}
              >
                + Add
              </Button>
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
