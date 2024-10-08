import React, { useState } from "react";
import axios from "axios";
import { Form, Button, Card, Alert, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // Mencegah perilaku default form submit

    try {
      const user = {
        username,
        password,
      };

      // Melakukan request login ke API
      const response = await axios.post(
        "http://localhost:8000/api/login",
        user,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Menyimpan token yang diterima dari respons API ke local storage
      localStorage.setItem("jwtToken", response.data.token);
      // Mendapatkan peran (role) dari respons API
      const role = response.data.role;

      // Mengarahkan pengguna sesuai peran (role) yang diperoleh
      if (role === "admin") {
        window.location.href = "/show";
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error:", error.response.data);
      setError("Login gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Log In</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleLogin}>
                {" "}
                {/* Menggunakan onSubmit untuk menangani form submit */}
                <Form.Group id="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </Form.Group>
                <Form.Group id="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>
                <Button
                  type="submit" // Menggunakan type submit untuk tombol "Log In"
                  className="w-100 mt-2"
                  disabled={loading}
                >
                  Log In
                </Button>
              </Form>
            </Card.Body>
          </Card>
          <div className="w-100 text-center mt-2">
            Need an account?<Link to="/register">Sign up</Link>
          </div>
        </>
      </div>
    </Container>
  );
}

export default Login;
