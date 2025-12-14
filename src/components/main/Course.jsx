import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoIosAdd } from "react-icons/io";
import { courseApi } from "../../services";
import CourseList from "../course/CourseList";
import CreateCourseModal from "../course/CreateCourseModal";
import EditCourseModal from "../course/EditCourseModal";
import Button from "../ui/Button";
import StatCard from "../ui/StatCard";
import styles from "./Course.module.css";

function Course() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    activeCourses: "00",
    weeklyFocus: "0 hrs",
    nextMilestone: "No courses yet",
  });

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await courseApi.getCourses();
      setCourses(data);
    } catch (err) {
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await courseApi.getCourseStats();
      setStats({
        activeCourses: data.activeCourses,
        weeklyFocus: data.weeklyFocus,
        nextMilestone: data.nextMilestone,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleCreateCourse = async (formData) => {
    await courseApi.createCourse(formData);
    setShowCreate(false);
    await fetchCourses();
    await fetchStats();
  };

  const handleEditCourse = async (courseId) => {
    try {
      const course = await courseApi.getCourse(courseId);
      setEditingCourse(course);
      setShowEdit(true);
    } catch (err) {
      setError("Failed to load course for editing");
    }
  };

  const handleUpdateCourse = async (formData) => {
    await courseApi.updateCourse(editingCourse.id, formData);
    setShowEdit(false);
    setEditingCourse(null);
    await fetchCourses();
    await fetchStats();
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await courseApi.deleteCourse(id);
      await fetchCourses();
      await fetchStats();
    } catch (err) {
      setError(err.message || "Failed to delete course");
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.pageActions}>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <IoIosAdd size={18} /> New course
        </Button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.statsRow}>
        <StatCard label="Active courses" value={stats.activeCourses} />
        <StatCard label="Weekly focus" value={stats.weeklyFocus} />
        <StatCard label="Next milestone" value={stats.nextMilestone} />
      </div>

      <CourseList
        courses={courses}
        loading={loading}
        onNavigate={(id) => navigate(`/app/course/${id}`)}
        onEdit={handleEditCourse}
        onDelete={handleDeleteCourse}
      />

      {showCreate && (
        <CreateCourseModal
          onSave={handleCreateCourse}
          onCancel={() => setShowCreate(false)}
        />
      )}
      {showEdit && editingCourse && (
        <EditCourseModal
          course={editingCourse}
          onSave={handleUpdateCourse}
          onCancel={() => {
            setShowEdit(false);
            setEditingCourse(null);
          }}
        />
      )}
    </section>
  );
}

export default Course;
