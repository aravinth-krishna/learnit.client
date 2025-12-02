import styles from "./Progress.module.css";
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
import { useState, useEffect } from "react";
import api from "../../services/api";

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
      const data = await api.getProgressDashboard();
      setDashboardData(data);
    } catch (err) {
      setError("Failed to load progress data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.kicker}>Insights</p>
            <h1>Progress overview</h1>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading progress data...
        </div>
      </section>
    );
  }

  if (error || !dashboardData) {
    return (
      <section className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.kicker}>Insights</p>
            <h1>Progress overview</h1>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
          {error || "Failed to load progress data"}
        </div>
      </section>
    );
  }

  const { stats, weeklyData, courseProgress, activityHeatmap } = dashboardData;

  const aiRecommendations = [
    "Shift ML sessions earlier in the week when focus is higher.",
    "React Basics pace is slowing — schedule a 45 min recap.",
    "Add a 20 min reflection after each deep work block.",
  ];

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Insights</p>
          <h1>Progress overview</h1>
        </div>
        <span className={styles.subtitle}>
          Updated {new Date(stats.lastUpdated).toLocaleDateString()}
        </span>
      </div>

      {/* METRICS */}
      <div className={styles.metricsRow}>
        {[
          ["🔥 Current Streak", `${stats.currentStreak} days`],
          ["🏆 Longest Streak", `${stats.longestStreak} days`],
          ["📅 Scheduled Hours", `${stats.totalScheduledHours} hrs`],
          ["⏳ Completed Hours", `${stats.totalCompletedHours} hrs`],
          ["📊 Completion Rate", `${stats.completionRate}%`],
          ["⚡ Efficiency", `${stats.efficiency}%`],
        ].map(([title, value], i) => (
          <div className={styles.metric} key={i}>
            <span>{title}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {/* OVERALL PROGRESS */}
      <div className={styles.section}>
        <h2>Overall Progress</h2>
        <div className={styles.progressBarOuter}>
          <div className={styles.progressBarInner} style={{ width: `${stats.overallProgress}%` }} />
        </div>
        <p className={styles.progressLabel}>{stats.overallProgress}% Completed</p>
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
              <Line dataKey="completed" stroke="#00b894" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* HEATMAP */}
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
            />
          ))}
        </div>
      </div>

      {/* COURSE PROGRESS */}
      <div className={styles.grid}>
        <div className={styles.section}>
          <h2>Course Progress</h2>
          <div className={styles.courseGrid}>
            {courseProgress.map((c, i) => (
              <div className={styles.courseCard} key={c.id}>
                <span className={styles.courseName}>{c.title}</span>
                <div className={styles.courseProgressBarOuter}>
                  <div
                    className={styles.courseProgressBarInner}
                    style={{ width: `${c.progressPercentage}%` }}
                  />
                </div>
                <span className={styles.coursePercent}>{c.progressPercentage}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

export default Progress;
