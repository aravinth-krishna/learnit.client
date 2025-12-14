import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { progressApi } from "../../services";
import styles from "./Progress.module.css";

function Progress() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await progressApi.getProgressDashboard();
      setDashboardData(data);
    } catch (err) {
      setError("Failed to load progress data");
      console.error("Progress data error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <section className={styles.page}>Loading progress data...</section>;
  }

  if (error || !dashboardData) {
    return (
      <section className={styles.page}>
        <div style={{ textAlign: "center", padding: "40px", color: "#c33" }}>
          {error || "Failed to load progress data"}
        </div>
      </section>
    );
  }

  const { stats, weeklyData, courseProgress, activityHeatmap } = dashboardData;

  const metricsData = [
    {
      icon: "🔥",
      label: "Current Streak",
      value: `${stats.currentStreak} days`,
    },
    {
      icon: "🏆",
      label: "Longest Streak",
      value: `${stats.longestStreak} days`,
    },
    {
      icon: "📅",
      label: "Scheduled Hours",
      value: `${stats.totalScheduledHours} hrs`,
    },
    {
      icon: "⏳",
      label: "Completed Hours",
      value: `${stats.totalCompletedHours} hrs`,
    },
    { icon: "📊", label: "Completion Rate", value: `${stats.completionRate}%` },
  ];

  return (
    <section className={styles.page}>
      <div className={styles.topGrid}>
        <div className={styles.leftStack}>
          <div className={styles.section}>
            <h2>Overall Progress</h2>
            <div className={styles.progressBarOuter}>
              <div
                className={styles.progressBarInner}
                style={{ width: `${stats.overallProgress}%` }}
              />
            </div>
            <p className={styles.progressLabel}>
              {stats.overallProgress}% Completed
            </p>
          </div>

          <div className={styles.section}>
            <h2>Study Activity Heatmap</h2>
            <div className={styles.heatmap}>
              {activityHeatmap.map((val, i) => (
                <div
                  key={i}
                  className={styles.heatBox}
                  style={{
                    background:
                      val === 0
                        ? "#e0e0e0"
                        : val === 1
                        ? "#b6e0ff"
                        : val === 2
                        ? "#64c0f0"
                        : "#008dd0",
                  }}
                  title={`Activity level: ${val}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.metricsColumn}>
          <div className={styles.metricsRow}>
            {metricsData.map((metric) => (
              <div className={styles.metric} key={metric.label}>
                <span className={styles.metricIcon}>{metric.icon}</span>
                <div className={styles.metricText}>
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <strong className={styles.metricValue}>{metric.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className={styles.chartsRow}>
        <div className={styles.chartBox}>
          <h2>Scheduled vs Completed</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="scheduled" fill="#007bff" />
              <Bar dataKey="completed" fill="#00b894" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartBox}>
          <h2>Weekly Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                dataKey="completed"
                stroke="#00b894"
                strokeWidth={2}
                dot={{ fill: "#00b894", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* COURSE PROGRESS */}
      <div className={styles.section}>
        <h2>Course Progress</h2>
        <div className={styles.courseGrid}>
          {courseProgress && courseProgress.length > 0 ? (
            courseProgress.map((course) => (
              <div className={styles.courseCard} key={course.id}>
                <span className={styles.courseName}>{course.title}</span>
                <div className={styles.courseProgressBarOuter}>
                  <div
                    className={styles.courseProgressBarInner}
                    style={{ width: `${course.progressPercentage}%` }}
                  />
                </div>
                <span className={styles.coursePercent}>
                  {course.progressPercentage}%
                </span>
              </div>
            ))
          ) : (
            <p className={styles.noData}>No courses in progress</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Progress;
