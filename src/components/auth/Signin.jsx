import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Signin.module.css";

function Signin() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("https://localhost:7271/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("Invalid credentials");
      return;
    }

    const data = await res.json();
    login(data.token); // STORE JWT
    navigate("/app/course"); // REDIRECT
  };

  return (
    <div className={styles.signin}>
      <h1>Log In</h1>
      <p>Enter your credentials to access your account.</p>

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          name="email"
          type="email"
          placeholder="john.doe@example.com"
          required
          onChange={handleChange}
        />

        <label>Password</label>
        <input
          name="password"
          type="password"
          placeholder="********"
          required
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
