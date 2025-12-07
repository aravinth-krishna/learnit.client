import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../services";
import { AuthContext } from "../../context/AuthContext";
import styles from "./Signup.module.css";

function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      console.log("[Signup] Attempting registration with:", {
        fullName: formData.fullName,
        email: formData.email,
      });

      const response = await authApi.register(
        formData.fullName,
        formData.email,
        formData.password
      );

      console.log("[Signup] Register response:", response);

      // API only returns { token }
      const token = response.token;

      if (!token) {
        setError("No token received from server");
        setLoading(false);
        return;
      }

      // Store token
      localStorage.setItem("token", token);
      console.log("[Signup] Token stored:", token.substring(0, 20) + "...");

      // Decode JWT to get user info (email, sub)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const user = {
          id: payload.sub,
          email: payload.email,
          fullName: formData.fullName,
        };

        // Call login to update context
        login(user);
        console.log("[Signup] User registered and logged in:", user);
      } catch (decodeErr) {
        console.warn(
          "[Signup] Could not decode token, logging in with token only"
        );
        login({ token, fullName: formData.fullName, email: formData.email });
      }

      // Navigate to dashboard
      setTimeout(() => {
        navigate("/app/course", { replace: true });
      }, 100);
    } catch (err) {
      console.error("[Signup] Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h2>Create your account</h2>
          <p>Join LearnIt and start learning today</p>
        </div>

        {error && (
          <div className={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <label className={styles.label}>
          <span>Full Name</span>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            required
            disabled={loading}
            autoComplete="name"
          />
        </label>

        <label className={styles.label}>
          <span>Email Address</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            disabled={loading}
            autoComplete="email"
          />
        </label>

        <label className={styles.label}>
          <span>Password</span>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            disabled={loading}
            minLength="6"
            autoComplete="new-password"
          />
        </label>

        <label className={styles.label}>
          <span>Confirm Password</span>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            required
            disabled={loading}
            minLength="6"
            autoComplete="new-password"
          />
        </label>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className={styles.footer}>
          Already have an account? <a href="/auth/login">Sign in here</a>
        </p>
      </form>
    </div>
  );
}

export default Signup;
