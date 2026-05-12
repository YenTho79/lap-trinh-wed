import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const login = async (data) => {
  return await axios.post(`${API_URL}/login/`, data);
};