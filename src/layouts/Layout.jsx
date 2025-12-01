import { Outlet, useLocation } from "react-router-dom";
import styles from "./Layout.module.css";
import Sidebar from "../components/main/Sidebar";

const PAGE_TITLES = {
  course: "Courses",
  schedule: "Schedule",
  progress: "Progress",
  profile: "Profile",
};

const Layout = () => {
  const location = useLocation();
  const section = location.pathname.split("/")[2] || "dashboard";
  const title = PAGE_TITLES[section] || "Dashboard";

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
            <div className={styles.userChip}>
              <div className={styles.avatar}>AK</div>
              <div>
                <span className={styles.userName}>Aravinth Krishna</span>
                <span className={styles.userRole}>Learner</span>
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
