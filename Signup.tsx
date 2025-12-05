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

const Signup = ({ onSignup }: { onSignup: () => void }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await axios.post(
        `${API_BASE_URL}/auth/register`,
        { name, email, password, role: "admin" },
        { headers: { "Content-Type": "application/json" } },
      );

      onSignup(); // Update app state
      navigate("/login"); // Navigate to login page after signup
    } catch (err: any) {
      setError(err.response?.data?.error || "Signup failed");
      console.error("Signup error:", err);
    }
  };

  return (
    <ThemeProvider theme={orangeTheme}>
      <Container maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            sx={{ fontWeight: 600, mb: 4 }}
          >
            Admin Signup
          </Typography>

          <Box component="form" onSubmit={handleSignup} sx={{ width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
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
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              Sign Up
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Signup;
