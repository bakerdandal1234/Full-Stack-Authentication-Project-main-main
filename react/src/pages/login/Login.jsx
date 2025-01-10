import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Modal,
  IconButton,
  Alert,
  InputAdornment,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Close as CloseIcon,
  Login as LoginIcon,
} from "@mui/icons-material";
import ErrorAlert from "../../components/ErrorAlert.jsx";
const Login = () => {
  const navigate = useNavigate();
  const { login, forgotPassword } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    resetEmail: "",
    resetStatus: "",
    showPassword: false,
    showForgotPassword: false,
    errors: {},
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      errors: {
        ...prev.errors,
        [name]: "",
        general: "",
      },
    }));
  };

  const setError = (field, error) => {
    setFormData((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error,
      },
    }));
  };

  const handleClickShowPassword = () => {
    setFormData((prev) => ({
      ...prev,
      showPassword: !prev.showPassword,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormData((prev) => ({
      ...prev,
      errors: {},
    }));

    try {
      const result = await login(formData.email, formData.password);
      console.log("Login result:", result);

      if (!result.success) {
        const errorMessage = result.message || "An error occurred during login.";
        if (errorMessage.toLowerCase().includes("verify")) {
          setError("verification", errorMessage);
        } else if (errorMessage.toLowerCase().includes("password")) {
          setError("password", errorMessage);
        } else if (errorMessage.toLowerCase().includes("email")) {
          setError("email", errorMessage);
        } else {
          setError("general", errorMessage);
        }
        return;
      } else {
        navigate("/home");
      }
    } catch (error) {
      console.error("Login form error:", error);
      setError("general", "An unexpected error occurred. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  const handleGithubLogin = () => {
    window.location.href = "http://localhost:3000/auth/github";
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await forgotPassword(formData.resetEmail);
      console.log(result);
      setFormData((prev) => ({
        ...prev,
        resetStatus: result.message || result.error,
        showForgotPassword: !result.success,
      }));
    } catch (error) {
      console.error("Password reset error:", error);
      setFormData((prev) => ({
        ...prev,
        resetStatus: "Failed to connect to the server. Please try again later.",
      }));
    }
  };

  return (
    <>
      <Container
        component="main"
        maxWidth="sm"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 3,
        }}
      >
        <Fade in timeout={800}>
          <Paper
            sx={{
              p: 4,
              width: "100%",
              backdropFilter: "blur(10px)",
              boxShadow: "0px 3px 10px rgba(0, 0, 0, 0.1)",
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(0, 0, 0, 0.8)"
                  : "rgba(255, 255, 255, 0.9)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <LoginIcon
                  sx={{
                    fontSize: 40,
                    color: "primary.main",
                    transform: "rotate(-10deg)",
                  }}
                />
                <Typography component="h1" variant="h4" fontWeight="bold">
                  Welcome Back
                </Typography>
              </Box>

              {formData.errors.verification && (
                <ErrorAlert
                  error={formData.errors.verification}
                  onClose={() =>
                    setFormData((prev) => ({
                      ...prev,
                      errors: { ...prev.errors, verification: "" },
                    }))
                  }
                />
              )}
              {formData.errors.general && (
                <ErrorAlert
                  error={formData.errors.general}
                  onClose={() =>
                    setFormData((prev) => ({
                      ...prev,
                      errors: { ...prev.errors, general: "" },
                    }))
                  }
                />
              )}

              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{
                  width: "100%",
                  gap: 2.5,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <TextField
                  fullWidth
                  required
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!formData.errors.email}
                  helperText={formData.errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  required
                  label="Password"
                  name="password"
                  type={formData.showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  error={!!formData.errors.password}
                  helperText={formData.errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon
                          sx={{
                            color: (theme) =>
                              theme.palette.mode === "dark"
                                ? "#fff"
                                : "text.secondary",
                          }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {formData.showPassword ? (
                            <VisibilityOff
                              sx={{
                                color: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? "#fff"
                                    : "text.secondary",
                              }}
                            />
                          ) : (
                            <Visibility
                              sx={{
                                color: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? "#fff"
                                    : "text.secondary",
                              }}
                            />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    py: 1.5,
                    mt: 1,
                    fontWeight: "bold",
                    fontSize: "1rem",
                    textTransform: "none",
                    background:
                      "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)",
                    },
                  }}
                >
                  Sign In
                </Button>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        showForgotPassword: true,
                      }))
                    }
                    sx={{
                      textTransform: "none",
                      fontSize: "0.9rem",
                      color: "text.secondary",
                      "&:hover": {
                        color: "primary.main",
                        backgroundColor: "transparent",
                      },
                    }}
                  >
                    Forgot Password?
                  </Button>
                  <Button
                    component={Link}
                    to="/signup"
                    sx={{
                      textTransform: "none",
                      fontSize: "0.9rem",
                      color: "primary.main",
                      "&:hover": { color: "primary.dark" },
                    }}
                  >
                    Create account
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>

                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexDirection: isMobile ? "column" : "row",
                  }}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleGoogleLogin}
                    startIcon={<GoogleIcon />}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      borderColor: "#EA4335",
                      color: "#EA4335",
                      "&:hover": {
                        borderColor: "#EA4335",
                        backgroundColor: "rgba(234, 67, 53, 0.04)",
                      },
                    }}
                  >
                    login with Google
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleGithubLogin}
                    startIcon={<GitHubIcon />}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      borderColor: "#EA4355",
                      backgroundColor: "#EA4355",
                      color: "#FFFFFF",
                      fontSize: "16px",
                      fontWeight: "bold",
                      "&:hover": {
                        borderColor: "#B02C3E",
                        backgroundColor: "#B02C3E",
                      },
                    }}
                  >
                    Login with GitHub
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Fade>

        <Modal
          open={formData.showForgotPassword}
          onClose={() =>
            setFormData((prev) => ({ ...prev, showForgotPassword: false }))
          }
          aria-labelledby="forgot-password-modal"
        >
          <Fade in={formData.showForgotPassword}>
            <Paper
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: { xs: "90%", sm: 400 },
                p: 4,
                borderRadius: 2,
                outline: "none",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  Reset Password
                </Typography>
                <IconButton
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      showForgotPassword: false,
                    }))
                  }
                  size="small"
                  sx={{ color: "text.secondary" }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {formData.resetStatus && (
                <Alert
                  severity={
                    formData.resetStatus.toLowerCase().includes("password")
                      ? "success"
                      : "error"
                  }
                  sx={{ mb: 2 }}
                >
                  {formData.resetStatus}
                </Alert>
              )}

              <form onSubmit={handleForgotPasswordSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  name="resetEmail"
                  type="email"
                  value={formData.resetEmail}
                  onChange={handleChange}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: "bold",
                    background:
                      "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)",
                    },
                  }}
                >
                  Send Reset Link
                </Button>
              </form>
            </Paper>
          </Fade>
        </Modal>
      </Container>
    </>
  );
};

export default Login;