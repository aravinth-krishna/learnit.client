import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Signup.module.css";
import api from "../../services/api";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      await api.register(form.fullName, form.email, form.password);
      alert("Account created! Please login.");
      navigate("/auth/login");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className={styles.signup}>
      <h1>Create Your Account</h1>
      <p>
        Join Learnit to optimize your study routines and track your progress.
      </p>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input 
          name="fullName" 
          value={form.fullName}
          onChange={handleChange} 
          required 
        />

        <label>Email</label>
        <input 
          name="email" 
          type="email" 
          value={form.email}
          onChange={handleChange} 
          required 
        />

        <label>Password</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <label>Confirm Password</label>
        <input
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
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
