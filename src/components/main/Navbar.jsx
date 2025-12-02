import styles from "./Navbar.module.css";
import { CgProfile } from "react-icons/cg";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useContext } from "react";
import { IoIosLogOut } from "react-icons/io";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      logout();
      navigate("/auth/login");
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link to="/">Learnit</Link>
      </div>

      <ul className={styles.navLinks}>
        <li>
          <Link to="/app/course">Courses</Link>
        </li>
        <li>
          <Link to="/app/schedule">Schedule</Link>
        </li>
        <li>
          <Link to="/app/progress">Progress</Link>
        </li>
        <li>
          <Link to="/app/profile">Profile</Link>
        </li>
      </ul>

      <div className={styles.profileWrapper} ref={menuRef}>
        <button className={styles.profileButton} onClick={() => setOpen(!open)}>
          <CgProfile size={26} />
        </button>

        {open && (
          <div className={styles.dropdown}>
            <Link to="/app/profile">Profile</Link>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <IoIosLogOut size={18} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
