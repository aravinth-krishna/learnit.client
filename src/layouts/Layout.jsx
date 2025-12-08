import { useContext, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import styles from "./Layout.module.css";
import Sidebar from "../components/main/Sidebar";
import { AuthContext } from "../context/AuthContext";

const PAGE_TITLES = {
  course: "Courses",
  schedule: "Schedule",
  progress: "Progress",
  profile: "Profile",
};

const Layout = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const section = location.pathname.split("/")[2] || "dashboard";
  const title = PAGE_TITLES[section] || "Dashboard";

  const { displayName, displayRole, initials, email } = useMemo(() => {
    const name = user?.fullName || user?.name || "";
    const derivedInitials = name
      ? name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0]?.toUpperCase())
          .join("")
      : user?.email?.[0]?.toUpperCase() || "U";

    return {
      displayName: name || user?.email || "Your account",
      displayRole: user?.role || "Learner",
      initials: derivedInitials,
      email: user?.email || "",
    };
  }, [user]);

  return (
    <div className={styles.dashboard}>
      <div className={styles.sidebarWrap}>
        <Sidebar />
      </div>

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.kicker}>Learning workspace</p>
            <h1 className={styles.topTitle}>{title}</h1>
          </div>

          <div className={styles.topRight}>
            <div className={styles.userChip} title={email}>
              <div className={styles.avatar}>{initials}</div>
              <div>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userRole}>{displayRole}</span>
              </div>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>

        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} Learnit AI Planner</span>
          <span>Focused learning made simple</span>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
