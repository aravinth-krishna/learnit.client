import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../services";
import { AuthContext } from "../../context/AuthContext";
import Button from "../ui/Button";
import Field from "../ui/Field";
import styles from "./Signin.module.css";

function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate inputs
      if (!email.trim() || !password.trim()) {
        setError("Email and password are required");
        setLoading(false);
        return;
      }

      console.log("[Signin] Attempting login with:", { email });

      const response = await authApi.login(email, password);

      console.log("[Signin] Login response:", response);

      // API only returns { token }
      const token = response.token;

      if (!token) {
        setError("No token received from server");
        setLoading(false);
        return;
      }

      // Store token
      localStorage.setItem("token", token);
      console.log("[Signin] Token stored:", token.substring(0, 20) + "...");

      // Decode JWT to get user info (email, sub)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const user = {
          id: payload.sub,
          email: payload.email,
        };

        // Call login to update context
        login(user);
        console.log("[Signin] User logged in:", user);
      } catch (decodeErr) {
        console.warn(
          "[Signin] Could not decode token, logging in with token only"
        );
        login({ token });
      }

      // Navigate to dashboard
      setTimeout(() => {
        navigate("/app/course", { replace: true });
      }, 100);
    } catch (err) {
      console.error("[Signin] Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h2>Welcome back</h2>
          <p>Sign in to your LearnIt account</p>
        </div>

        {error && (
          <div className={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <Field label="Email Address">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
            autoComplete="email"
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </Field>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className={styles.fullWidth}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <p className={styles.footer}>
          Don't have an account? <a href="/auth/register">Sign up here</a>
        </p>
      </form>
    </div>
  );
}

export default Signin;
