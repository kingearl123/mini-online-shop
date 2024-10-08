import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "customer", // Default role to customer
  });

  const [message, setMessage] = useState(""); // State untuk pesan

  const { username, password, role } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const newUser = {
        username,
        password,
        role,
      };

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const body = JSON.stringify(newUser);
      // Menggunakan URL lengkap untuk permintaan axios
      const res = await axios.post(
        "http://localhost:8000/api/register",
        body,
        config
      );
      console.log(res.data);
      setMessage("User registered successfully"); // Set pesan sukses
    } catch (error) {
      console.error(error.response.data);
      setMessage("Registration failed. Please try again."); // Set pesan gagal
    }
  };

  return (
    <div className="register">
      <h1>Register</h1>
      <form onSubmit={(e) => onSubmit(e)}>
        <div className="mb-3">
          <input
            type="text"
            placeholder="Username"
            name="username"
            value={username}
            onChange={(e) => onChange(e)}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={password}
            onChange={(e) => onChange(e)}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <select
            name="role"
            value={role}
            onChange={(e) => onChange(e)}
            className="form-select"
          >
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Register
        </button>
      </form>
      {message && <div className="alert alert-info mt-3">{message}</div>}{" "}
      {/* Menampilkan pesan */}
    </div>
  );
};

export default Register;
