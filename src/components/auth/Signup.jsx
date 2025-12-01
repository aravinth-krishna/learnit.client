import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Signup.module.css";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    await fetch("https://localhost:7271/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    alert("Account created! Please login.");
    navigate("/auth/login");
  };

  return (
    <div className={styles.signup}>
      <h1>Create Your Account</h1>
      <p>
        Join Learnit to optimize your study routines and track your progress.
      </p>

      <form onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input name="fullName" onChange={handleChange} required />

        <label>Email</label>
        <input name="email" type="email" onChange={handleChange} required />

        <label>Password</label>
        <input
          name="password"
          type="password"
          onChange={handleChange}
          required
        />

        <label>Confirm Password</label>
        <input
          name="confirmPassword"
          type="password"
          onChange={handleChange}
          required
        />

        <button type="submit">Create Account</button>

        <div className={styles.extra}>
          <span>
            Already have an account? <Link to="/auth/login">Sign In</Link>
          </span>
        </div>
      </form>
    </div>
  );
}

export default Signup;
