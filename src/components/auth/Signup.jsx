import { useState, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../services";
import { AuthContext } from "../../context/AuthContext";
import Button from "../ui/Button";
import styles from "./Signup.module.css";

function Signup() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const inputs = useMemo(
    () => [
      {
        name: "fullName",
        label: "Full name",
        type: "text",
        placeholder: "Jordan Lee",
        autoComplete: "name",
      },
      {
        name: "email",
        label: "Email address",
        type: "email",
        placeholder: "you@example.com",
        autoComplete: "email",
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "••••••••",
        autoComplete: "new-password",
        minLength: 6,
      },
      {
        name: "confirmPassword",
        label: "Confirm password",
        type: "password",
        placeholder: "••••••••",
        autoComplete: "new-password",
        minLength: 6,
      },
    ],
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const applySession = (token) => {
    localStorage.setItem("token", token);
    const baseUser = (() => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return {
          id: payload.sub,
          email: payload.email,
          fullName: form.fullName,
        };
      } catch (err) {
        return { fullName: form.fullName, email: form.email };
      }
    })();
    login({ ...baseUser, token });
    navigate("/app/course", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return setError("Full name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match");

    setLoading(true);
    setError("");
    try {
      const { token } = await authApi.register(
        form.fullName,
        form.email,
        form.password
      );
      if (!token) throw new Error("No token received from server");
      applySession(token);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layout}>
      <div className={styles.brandPane}>
        <p className={styles.kicker}>Learnit</p>
        <h1>Create your account</h1>
        <p className={styles.copy}>
          Set up your workspace and start tracking courses in minutes.
        </p>
      </div>

      <div className={styles.cardPane}>
        <div className={styles.card}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Get started</p>
              <h2>Join the workspace</h2>
              <p className={styles.subhead}>
                Create your profile and begin organizing your learning.
              </p>
            </div>
            <Link to="/auth/login" className={styles.inlineLink}>
              Already a member?
            </Link>
          </header>

          {error && (
            <div className={styles.error} role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {inputs.map((field) => (
              <label key={field.name} className={styles.field}>
                <span>{field.label}</span>
                <input
                  {...field}
                  value={form[field.name]}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  autoFocus={field.name === "fullName"}
                />
              </label>
            ))}

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className={styles.footerText}>
            Have an account? <Link to="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
