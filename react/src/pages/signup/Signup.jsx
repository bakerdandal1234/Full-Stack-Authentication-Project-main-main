import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Key as KeyIcon,
  Person as PersonIcon,
  HowToReg as HowToRegIcon,
} from "@mui/icons-material";
import ErrorAlert from "../../components/ErrorAlert.jsx";
const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
    errors: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      general: "",
    },
  });

  const handleChange = ({ target: { name, value } }) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setFormData((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          confirmPassword: "Passwords do not match!",
        },
      }));
      return;
    }

    try {
      const result = await signup(
        formData.username,
        formData.email,
        formData.password
      );
      console.log(result);
      if (!result.success) {
        if (result.error && Array.isArray(result.error)) {
          const newErrors = { ...formData.errors };

          result.error.forEach((item) => {
            switch (item.path) {
              case "email":
                newErrors.email = item.msg;
                break;
              case "username":
                newErrors.username = item.msg;
                break;
              case "password":
                newErrors.password = item.msg;
                break;
              default:
                break;
            }
          });

          setFormData((prev) => ({
            ...prev,
            errors: newErrors,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            errors: {
              ...prev.errors,
              email: result.error,
            },
          }));
        }
        return;
      }

      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);
      setFormData((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          general: "Failed to sign up. Please try again.",
        },
      }));
    }
  };

  const handleClickShowPassword = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Fade in timeout={800}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: "100%",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(0, 0, 0, 0.8)"
                : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(255,255,255,0.3)",
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
              <HowToRegIcon
                sx={{
                  fontSize: 40,
                  color: "primary.main",
                  transform: "rotate(-10deg)",
                }}
              />
              <Typography component="h1" variant="h4" fontWeight="bold">
                Create Account
              </Typography>
            </Box>

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
              sx={{
                width: "100%",
                gap: 2.5,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={!!formData.errors.username}
                helperText={formData.errors.username}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="text"
                value={formData.email}
                onChange={handleChange}
                error={!!formData.errors.email}
                helperText={formData.errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
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
                      <KeyIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleClickShowPassword("showPassword")}
                        edge="end"
                      >
                        {formData.showPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={formData.showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!formData.errors.confirmPassword}
                helperText={formData.errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          handleClickShowPassword("showConfirmPassword")
                        }
                        edge="end"
                      >
                        {formData.showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
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
                Sign Up
              </Button>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                  mt: 2,
                }}
              >
                <Button
                  component={Link}
                  to="/login"
                  sx={{
                    textTransform: "none",
                    fontSize: "0.9rem",
                    color: "text.secondary",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Already have an account? Sign in
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default Signup;