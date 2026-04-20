import api from "./index";

export const login = (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  return api.post("/api/v1/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};
