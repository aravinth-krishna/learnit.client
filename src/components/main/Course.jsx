import styles from "./Course.module.css";
import { FaFilter, FaSearch, FaSort } from "react-icons/fa";
import { useEffect, useState } from "react";
import { IoIosAdd } from "react-icons/io";
import api from "../../services/api";

const filterGroups = {
  priority: ["Low", "Medium", "High"],
  difficulty: ["Beginner", "Intermediate", "Advanced"],
  duration: ["< 1 hour", "1-3 hours", "> 3 hours"],
};

const sortOptions = [
  { value: "createdAt", label: "Date Created" },
  { value: "title", label: "Title" },
  { value: "priority", label: "Priority" },
  { value: "difficulty", label: "Difficulty" },
  { value: "hours", label: "Total Hours" },
];

function Course() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    activeCourses: "00",
    weeklyFocus: "0 hrs",
    nextMilestone: "No courses yet",
  });

  const [search, setSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    priority: [],
    difficulty: [],
    duration: [],
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState("manual");
  const [modules, setModules] = useState([{ title: "", duration: "" }]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectArea: "",
    learningObjectives: "",
    difficulty: "",
    priority: "",
    totalEstimatedHours: "",
    targetCompletionDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch courses
  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, [search, selectedFilters, sortBy, sortOrder]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        search: search || undefined,
        priority: selectedFilters.priority.length > 0 
          ? selectedFilters.priority.join(",") 
          : undefined,
        difficulty: selectedFilters.difficulty.length > 0
          ? selectedFilters.difficulty.join(",")
          : undefined,
        duration: selectedFilters.duration.length > 0
          ? selectedFilters.duration[0] // API expects single duration value
          : undefined,
        sortBy,
        sortOrder,
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const data = await api.getCourses(params);
      setCourses(data);
    } catch (err) {
      setError(err.message || "Failed to load courses");
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getCourseStats();
      setStats({
        activeCourses: data.activeCourses,
        weeklyFocus: data.weeklyFocus,
        nextMilestone: data.nextMilestone,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const toggleFilter = (group, option) => {
    setSelectedFilters((prev) => {
      const set = new Set(prev[group]);
      if (set.has(option)) {
        set.delete(option);
      } else {
        set.add(option);
      }
      return { ...prev, [group]: Array.from(set) };
    });
  };

  const resetFilters = () => {
    setSelectedFilters({ priority: [], difficulty: [], duration: [] });
    setSearch("");
  };

  const handleModuleChange = (index, field, value) => {
    setModules((prev) =>
      prev.map((module, i) =>
        i === index ? { ...module, [field]: value } : module
      )
    );
  };

  const addModule = () =>
    setModules((prev) => [...prev, { title: "", duration: "" }]);

  const removeModule = (index) =>
    setModules((prev) => prev.filter((_, i) => i !== index));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Validate modules
      const validModules = modules.filter(
        (m) => m.title.trim() !== "" && m.duration !== ""
      );

      if (validModules.length === 0) {
        setError("Please add at least one module");
        setSubmitting(false);
        return;
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        subjectArea: formData.subjectArea,
        learningObjectives: formData.learningObjectives,
        difficulty: formData.difficulty,
        priority: formData.priority,
        totalEstimatedHours: parseInt(formData.totalEstimatedHours) || 0,
        targetCompletionDate: formData.targetCompletionDate || null,
        modules: validModules.map((m) => ({
          title: m.title,
          estimatedHours: parseInt(m.duration) || 0,
        })),
      };

      await api.createCourse(courseData);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        subjectArea: "",
        learningObjectives: "",
        difficulty: "",
        priority: "",
        totalEstimatedHours: "",
        targetCompletionDate: "",
      });
      setModules([{ title: "", duration: "" }]);
      setShowCreate(false);
      
      // Refresh courses
      await fetchCourses();
      await fetchStats();
    } catch (err) {
      setError(err.message || "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await api.deleteCourse(id);
      await fetchCourses();
      await fetchStats();
    } catch (err) {
      setError(err.message || "Failed to delete course");
    }
  };

  const getDurationCategory = (hours) => {
    if (hours < 1) return "< 1 hour";
    if (hours <= 3) return "1-3 hours";
    return "> 3 hours";
  };

  return (
    <section className={styles.page}>
      <header className={styles.pageHero}>
        <div>
          <p className={styles.kicker}>Course Management</p>
          <h1>Course workspace</h1>
          <p className={styles.subtle}>
            Create, organize, and track your learning courses.
          </p>
        </div>

        <div className={styles.heroActions}>
          <button
            className={styles.secondaryBtn}
            type="button"
            onClick={resetFilters}
          >
            Clear filters
          </button>
          <button
            className={styles.primaryBtn}
            type="button"
            onClick={() => setShowCreate(true)}
          >
            <IoIosAdd size={18} />
            New course
          </button>
        </div>
      </header>

      {error && !loading && (
        <div className={styles.errorMessage} style={{ color: 'red', padding: '12px', border: '1px solid red', background: '#ffe6e6' }}>
          {error}
        </div>
      )}

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span>Active courses</span>
          <strong>{stats.activeCourses}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Weekly focus</span>
          <strong>{stats.weeklyFocus}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Next milestone</span>
          <strong>{stats.nextMilestone}</strong>
        </div>
      </div>

      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.sortControls}>
          <FaSort />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <span className={styles.resultSummary}>
          {loading ? "Loading..." : `${courses.length} course${courses.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className={styles.filtersBar}>
        <span>
          <FaFilter /> Filters
        </span>
        <div className={styles.filterGroupsRow}>
          {Object.entries(filterGroups).map(([group, options]) => (
            <div key={group} className={styles.filterGroup}>
              <p>{group}</p>
              <div className={styles.chips}>
                {options.map((option) => {
                  const active = selectedFilters[group].includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`${styles.chip} ${
                        active ? styles.chipActive : ""
                      }`}
                      onClick={() => toggleFilter(group, option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.primaryColumn}>
          {loading ? (
            <div className={styles.emptyState}>
              <p>Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No courses found. Create your first course to get started!</p>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setShowCreate(true)}
              >
                Create Course
              </button>
            </div>
          ) : (
            <div className={styles.courseGrid}>
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  {...course}
                  duration={getDurationCategory(course.totalEstimatedHours)}
                  onDelete={handleDeleteCourse}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>Create course</p>
                <h2>Add a new course</h2>
              </div>
              <button
                className={styles.iconBtn}
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setError("");
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.modalTabs}>
              <button
                type="button"
                className={`${styles.tab} ${styles.tabActive}`}
                onClick={() => setCreateMode("manual")}
              >
                Build manually
              </button>
              <button
                type="button"
                className={`${styles.tab} ${styles.tabDisabled}`}
                disabled
                title="AI features coming soon"
              >
                Ask AI (Coming Soon)
              </button>
            </div>

            {createMode === "manual" && (
              <form className={styles.modalForm} onSubmit={handleManualSubmit}>
                <div className={styles.formGrid}>
                  <label>
                    Course title *
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g. Machine Learning Foundations"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Subject area
                    <select
                      name="subjectArea"
                      value={formData.subjectArea}
                      onChange={handleInputChange}
                    >
                      <option value="">Select category</option>
                      <option>Programming</option>
                      <option>Data Science</option>
                      <option>Web Development</option>
                      <option>Design</option>
                      <option>Business</option>
                      <option>Science</option>
                      <option>Mathematics</option>
                      <option>Language</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>

                <label>
                  Description
                  <textarea
                    name="description"
                    placeholder="Brief description of the course"
                    rows={2}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </label>

                <label>
                  Learning objectives
                  <textarea
                    name="learningObjectives"
                    placeholder="What will you achieve? e.g. Build ML models, understand algorithms"
                    rows={2}
                    value={formData.learningObjectives}
                    onChange={handleInputChange}
                  />
                </label>

                <div className={styles.formGrid}>
                  <label>
                    Difficulty level
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                    >
                      <option value="">Select difficulty</option>
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </label>
                  <label>
                    Priority
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                    >
                      <option value="">Select priority</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </label>
                </div>

                <div className={styles.formGrid}>
                  <label>
                    Total estimated hours *
                    <input
                      type="number"
                      name="totalEstimatedHours"
                      min="1"
                      placeholder="24"
                      value={formData.totalEstimatedHours}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Target completion
                    <input
                      type="date"
                      name="targetCompletionDate"
                      value={formData.targetCompletionDate}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>

                <div className={styles.modulesHeader}>
                  <span>Course modules *</span>
                  <button type="button" onClick={addModule}>
                    + Add module
                  </button>
                </div>

                <div className={styles.modulesList}>
                  {modules.map((module, index) => (
                    <div key={index} className={styles.moduleRow}>
                      <input
                        type="text"
                        placeholder="Module name"
                        value={module.title}
                        onChange={(e) =>
                          handleModuleChange(index, "title", e.target.value)
                        }
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Hours"
                        value={module.duration}
                        onChange={(e) =>
                          handleModuleChange(index, "duration", e.target.value)
                        }
                      />
                      {modules.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeModule(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>
                )}

                <div className={styles.formActions}>
                  <button
                    className={styles.secondaryBtn}
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setError("");
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.primaryBtn}
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save course"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function CourseCard({
  id,
  title,
  description,
  hoursRemaining,
  totalEstimatedHours,
  priority,
  difficulty,
  duration,
  onDelete,
}) {
  return (
    <article className={styles.courseCard}>
      <div className={styles.cardImage}>
        <div className={styles.imagePlaceholder}>
          {title.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <div className={styles.cardMeta}>
            {priority && <span>{priority}</span>}
            {difficulty && <span>{difficulty}</span>}
          </div>
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete(id)}
            title="Delete course"
          >
            ×
          </button>
        </div>
        <h3>{title}</h3>
        <p>{description || "No description provided"}</p>
        <span className={styles.hours}>
          {hoursRemaining || totalEstimatedHours} hrs remaining
        </span>
      </div>
    </article>
  );
}

export default Course;
