import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  createTheme,
  ThemeProvider,
} from "@mui/material";

const orangeTheme = createTheme({
  palette: {
    primary: {
      main: "#FF6D00",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
          padding: "10px 0",
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          marginTop: 64,
        },
      },
    },
  },
});

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } },
      );

      localStorage.setItem("adminToken", res.data.token);
      onLogin();

      // IMPORTANT FIX: remove login page from browser history
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
      console.error("Login error:", err);
    }
  };

  return (
    <ThemeProvider theme={orangeTheme}>
      <Container maxWidth="xs">
        <Box>
          <Typography
            variant="h4"
            component="h1"
            align="center"
            gutterBottom
            sx={{ fontWeight: "bold", color: "primary.main", marginBottom: 3 }}
          >
            Admin Login
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              margin="normal"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 4 }}
            >
              Login
            </Button>
          </form>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Login;
