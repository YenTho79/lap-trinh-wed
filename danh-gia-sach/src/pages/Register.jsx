import React, { useState } from "react";
import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [darkMode] = useState(false);

  const [formData, setFormData] = useState({
    username: "", // Thêm trường username
    email: "",
    password: "",
    confirmPassword: ""
  });

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWriteReview = () => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để viết đánh giá.");
      navigate("/login");
      return;
    }
    navigate("/write-review");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    alert("Đăng xuất thành công!");
    navigate("/login");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const { username, email, password, confirmPassword } = formData;

    // 1. Kiểm tra tính hợp lệ (Thêm check username)
    if (!username || !email || !password || !confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không đúng.");
      return;
    }

    try {
      // 2. Gửi dữ liệu thật tới Backend
      const response = await axios.post("http://127.0.0.1:8000/api/register/", {
        username: username, // Gửi username riêng
        email: email,       // Gửi email riêng
        password: password
      });

      alert(response.data.message || "Đăng ký thành công!");
      navigate("/login");

    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      const errorMsg = error.response?.data?.message || "Đăng ký thất bại! Tên đăng nhập hoặc Email có thể đã tồn tại.";
      alert(errorMsg);
    }
  };

  return (
    <div className={`home-body ${darkMode ? "dark-mode" : ""}`}>
      <header className="home-header">
        <div className="logo">
          <Link to="/">
            <img
              src="/images/logo.png"
              alt="Góc Sách"
              style={{ height: "45px", width: "auto", display: "block" }}
            />
          </Link>
        </div>

        <nav className="nav-links">
          <Link to="/">Sách</Link>
          <Link to="/">Liên hệ</Link>

          {currentUser?.role === "admin" && (
            <Link to="/admin" className="admin-link">ADMIN</Link>
          )}

          {!currentUser ? (
            <>
              <Link to="/login">Đăng nhập</Link>
              <button type="button" className="btn-cta nav-btn" onClick={handleWriteReview}>
                Viết đánh giá
              </button>
            </>
          ) : (
            <>
              <span className="user-badge">
                {currentUser.role === "admin" ? `Admin: ${currentUser.username}` : `Xin chào, ${currentUser.username}`}
              </span>
              <button type="button" className="btn-cta nav-btn" onClick={handleWriteReview}>
                Viết đánh giá
              </button>
              <button type="button" className="logout-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          )}
        </nav>
      </header>

      <div className="register-container">
        <form className="register-box" onSubmit={handleRegister}>
          <h2>Đăng ký tài khoản</h2>

          {/* --- Ô NHẬP USERNAME MỚI --- */}
          <div className="input-group">
            <label>Tên đăng nhập (Username)</label>
            <input
              type="text"
              name="username"
              placeholder="Ví dụ: yentho123"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Ví dụ: example@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group password-group">
            <label>Mật khẩu</label>
            <input
              type={showPass ? "text" : "password"}
              name="password"
              placeholder="Tối thiểu 6 ký tự"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <i
              className={`fa-solid ${showPass ? "fa-eye-slash" : "fa-eye"}`}
              onClick={() => setShowPass((prev) => !prev)}
            ></i>
          </div>

          <div className="input-group password-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type={showConfirmPass ? "text" : "password"}
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <i
              className={`fa-solid ${showConfirmPass ? "fa-eye-slash" : "fa-eye"}`}
              onClick={() => setShowConfirmPass((prev) => !prev)}
            ></i>
          </div>

          <button type="submit" className="register-button">
            Đăng ký ngay
          </button>

          <p className="switch-text">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;