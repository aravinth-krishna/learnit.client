import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseApi } from "../../services";
import CourseList from "../course/CourseList";
import CreateCourseModal from "../course/CreateCourseModal";
import EditCourseModal from "../course/EditCourseModal";
import styles from "./Course.module.css";

function Course() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
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

  const handleCreateCourse = async (formData) => {
    await courseApi.createCourse(formData);
    setShowCreate(false);
    await fetchCourses();
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
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await courseApi.deleteCourse(id);
      await fetchCourses();
    } catch (err) {
      setError(err.message || "Failed to delete course");
    }
  };

  return (
    <section className={styles.page}>
      {error && <div className={styles.errorMessage}>{error}</div>}

      <CourseList
        courses={courses}
        loading={loading}
        onNavigate={(id) => navigate(`/app/course/${id}`)}
        onEdit={handleEditCourse}
        onDelete={handleDeleteCourse}
        onCreate={() => setShowCreate(true)}
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
