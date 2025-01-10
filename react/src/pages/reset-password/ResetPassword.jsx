import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import { useTheme } from "@mui/material/styles";
import ErrorAlert from "../../components/ErrorAlert.jsx";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { verifyResetToken, resetPassword } = useAuth();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    loading: true,
    tokenExpired: false,
    error: "",
    success: "",
    showPassword: false,
  });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const result = await verifyResetToken(token);
        setFormData((prev) => ({
          ...prev,
          loading: false,
          tokenExpired: result.error?.toLowerCase().includes("expired"), //true or false
          error: result.error || "",
        }));
      } catch (error) {
        setFormData((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to verify token",
        }));
      }
    };

    verifyToken();
  }, [token, verifyResetToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من تطابق كلمات المرور
    if (formData.password !== formData.confirmPassword) {
      setFormData((prev) => ({
        ...prev,
        error: "passwords do not match!",
      }));
      return;
    }

    // التحقق من طول كلمة المرور
    if (formData.password.length < 6) {
      setFormData((prev) => ({
        ...prev,
        error: "password must be at least 6 characters long!",
      }));
      return;
    }

    try {
      const result = await resetPassword(token, formData.password);
      console.log(result)
      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          success:result.message ||"password  reset successfully",
          error: "",
        }));
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      setFormData((prev) => ({
        ...prev,
        error: "failed to reset password",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      error: "", // مسح رسالة الخطأ عند الكتابة
    }));
  };

  if (formData.loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            reset password
          </Typography>

          {formData.tokenExpired ? (
            <>
              <ErrorAlert 
                error={formData.error}
                onClose={() => setFormData(prev => ({ ...prev, error: "" }))}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate("/login")}
                sx={{ mt: 1 }}
              >
                Return to Login
              </Button>
            </>
          ) : (
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: "100%" }}
            >
              {formData.error && (
                <ErrorAlert 
                  error={formData.error}
                  onClose={() => setFormData(prev => ({ ...prev, error: "" }))}
                />
              )}
              {formData.success && (
                <ErrorAlert 
                  severity="success"
                  error={formData.success}
                  onClose={() => setFormData(prev => ({ ...prev, success: "" }))}
                />
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="كلمة المرور الجديدة"
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockResetIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm password"
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockResetIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={formData.tokenExpired}
              >
                reset password
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;
