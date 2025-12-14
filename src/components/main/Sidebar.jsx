import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { useLogout } from "../../hooks/useLogout";
import { useTheme } from "../../context/useTheme";
import { scheduleApi } from "../../services";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { IoIosLogOut } from "react-icons/io";
import { MdOutlineMenuBook } from "react-icons/md";
import { AiOutlineSchedule } from "react-icons/ai";
import { BsGraphUp, BsChatDots } from "react-icons/bs";
import { CgProfile } from "react-icons/cg";
import { BsSun, BsMoon } from "react-icons/bs";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useLogout();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState("");
  const [weekStats, setWeekStats] = useState({ scheduled: 0, completed: 0 });

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setScheduleLoading(true);
        setScheduleError("");
        const data = await scheduleApi.getScheduleEvents();

        const now = new Date();
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() + diffToMonday);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        let scheduled = 0;
        let completed = 0;

        data.forEach((e) => {
          if (!e.courseModuleId) return;
          const start = new Date(e.startUtc);
          const end = e.endUtc
            ? new Date(e.endUtc)
            : new Date(start.getTime() + 60 * 60 * 1000);

          if (start >= weekStart && start < weekEnd) {
            const hours = Math.max(0.25, (end - start) / (1000 * 60 * 60));
            scheduled += hours;
            if (end <= now) completed += hours;
          }
        });

        setWeekStats({
          scheduled: Math.round(scheduled * 10) / 10,
          completed: Math.round(completed * 10) / 10,
        });
      } catch (err) {
        setScheduleError(err?.message || "Failed to load schedule");
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const formatHours = (hours) => {
    if (hours === null || hours === undefined) return "--";
    const rounded = Math.round(hours * 10) / 10;
    const display = Number.isInteger(rounded)
      ? rounded.toFixed(0)
      : rounded.toFixed(1);
    return `${display} hrs`;
  };

  const targetHours = weekStats.scheduled;
  const completedHours = weekStats.completed;
  const completionPct = targetHours
    ? Math.min(100, Math.round((completedHours / targetHours) * 100))
    : 0;

  const targetLabel = scheduleLoading ? "Loading..." : formatHours(targetHours);

  const completionLabel = scheduleLoading
    ? "Syncing schedule"
    : `${completionPct}% complete`;

  const menuItems = useMemo(
    () => [
      {
        path: "/app/course",
        label: "Courses",
        icon: <MdOutlineMenuBook size={22} />,
        activeKey: "course",
      },
      {
        path: "/app/schedule",
        label: "Schedule",
        icon: <AiOutlineSchedule size={22} />,
        activeKey: "schedule",
      },
      {
        path: "/app/progress",
        label: "Progress",
        icon: <BsGraphUp size={22} />,
        activeKey: "progress",
      },
      {
        path: "/app/profile",
        label: "Profile",
        icon: <CgProfile size={22} />,
        activeKey: "profile",
      },
      {
        path: "/app/ai",
        label: "AI",
        icon: <BsChatDots size={22} />,
        activeKey: "ai",
      },
    ],
    []
  );

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
      aria-label="Primary"
    >
      <button
        className={styles.toggleBtn}
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        type="button"
      >
        {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
      </button>

      <div className={styles.branding}>
        <div className={styles.logoMark}>L</div>
        {!collapsed && (
          <div>
            <p className={styles.brandTitle}>Learnit</p>
            <span className={styles.brandTag}>Study hub</span>
          </div>
        )}
      </div>

      <div className={styles.sectionLabel}>Navigate</div>
      <nav className={styles.menu}>
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.activeKey);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!collapsed && <span className={styles.label}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={styles.sectionLabel}>Focus</div>
      <div className={styles.focusCard}>
        <p>Week target</p>
        <h3>{targetLabel}</h3>
        <div className={styles.progressTrack}>
          <span style={{ width: `${completionPct}%` }} />
        </div>
        {!collapsed && <small>{completionLabel}</small>}
        {!collapsed && scheduleError && (
          <small className={styles.errorText}>Schedule data unavailable</small>
        )}
      </div>

      <div className={styles.footerSection}>
        <button
          className={styles.ghostBtn}
          type="button"
          onClick={toggleDarkMode}
          aria-label="Toggle theme"
        >
          <span className={styles.icon}>
            {isDarkMode ? <BsSun size={18} /> : <BsMoon size={18} />}
          </span>
          {!collapsed && (isDarkMode ? "Light mode" : "Dark mode")}
        </button>
        <button
          className={styles.logoutBtn}
          type="button"
          onClick={logout}
          aria-label="Logout"
        >
          <span className={styles.icon}>
            <IoIosLogOut size={20} />
          </span>
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
