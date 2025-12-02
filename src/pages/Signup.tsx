import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';

const Signup = ({ onSignup }: { onSignup: () => void }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:5000/api/register', { name, email, password, role: 'admin' });
      onSignup(); // Update app state
      navigate('/login'); // Navigate to login page after signup
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8} p={3} boxShadow={3} borderRadius={2} bgcolor="#fff">
        <Typography variant="h5" mb={2} align="center">Admin Signup</Typography>
        <form onSubmit={handleSignup}>
          <TextField label="Name" variant="outlined" fullWidth margin="normal" required value={name} onChange={e => setName(e.target.value)} />
          <TextField label="Email" type="email" variant="outlined" fullWidth margin="normal" required value={email} onChange={e => setEmail(e.target.value)} />
          <TextField label="Password" type="password" variant="outlined" fullWidth margin="normal" required value={password} onChange={e => setPassword(e.target.value)} />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Sign Up</Button>
        </form>
      </Box>
    </Container>
  );
};

export default Signup;
