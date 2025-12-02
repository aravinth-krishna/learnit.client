import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Signin.module.css";
import api from "../../services/api";

function Signin() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await api.login(form.email, form.password);
      login(data.token);
      navigate("/app/course");
    } catch (err) {
      setError(err.message || "Invalid credentials");
    }
  };

  return (
    <div className={styles.signin}>
      <h1>Log In</h1>
      <p>Enter your credentials to access your account.</p>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          name="email"
          type="email"
          placeholder="john.doe@example.com"
          required
          value={form.email}
          onChange={handleChange}
        />

        <label>Password</label>
        <input
          name="password"
          type="password"
          placeholder="********"
          required
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit">Login</button>

        <div className={styles.extra}>
          <Link to="/auth/forgot-password">Forgot Password?</Link>
          <span>
            Don't have an account? <Link to="/auth/register">Sign Up</Link>
          </span>
        </div>
      </form>
    </div>
  );
}

export default Signin;
