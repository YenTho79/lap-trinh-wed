import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "", // Trường này sẽ nhận cả Username hoặc Email
    password: ""
  });

  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("currentUser"))
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    alert("Đăng xuất thành công!");
    navigate("/");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      // Send the identifier both as `email` and `username` so backend can accept either
      const response = await axios.post(
        "http://127.0.0.1:8000/api/login/",
        {
          username: formData.username,
          email: formData.username,
          password: formData.password,
        }
      );

      const { token, user_info, message } = response.data;

      // normalize and augment user info for frontend convenience
      const normalized = {
        ...user_info,
        displayName:
          user_info?.username || user_info?.ten_dang_nhap || user_info?.display_name || user_info?.email,
        isAdmin:
          Boolean(user_info?.is_admin) ||
          (typeof user_info?.role === "string" && user_info.role.toLowerCase() === "admin") ||
          user_info?.is_staff === true ||
          user_info?.is_superuser === true,
      };

      // persist token and user
      localStorage.setItem("token", token);
      localStorage.setItem("currentUser", JSON.stringify(normalized));
      setCurrentUser(normalized);

      alert(message || "Đăng nhập thành công!");

      // After login, always go to home page. Admins can access the admin area via the ADMIN link.
      navigate("/");
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      const errorMsg = error.response?.data?.message || "Đăng nhập thất bại! Kiểm tra lại tài khoản.";
      alert(errorMsg);
    }
  };

  return (
    <div className="home-body">
      <header className="home-header">
        <div className="logo">
          <Link to="/"><img src="/images/logo.png" alt="Góc Sách" style={{ height: "45px" }} /></Link>
        </div>

        <nav className="nav-links">
          <Link to="/">Sách</Link>
          <Link to="/">Liên hệ</Link>

          {currentUser?.isAdmin && (
            <Link to="/admin" className="admin-link" style={{ backgroundColor: '#7a4a4a', color: 'white', padding: '5px 15px', borderRadius: '20px' }}>
              ADMIN
            </Link>
          )}

          {!currentUser ? (
            <Link to="/login" className="login-nav-link">Đăng nhập</Link>
          ) : (
            <div className="user-section" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span className="user-badge" style={{ background: '#f0f0f0', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>
                {currentUser.isAdmin ? `Admin: ${currentUser.displayName}` : `Xin chào, ${currentUser.displayName}`}
              </span>
              <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
            </div>
          )}
          
          <button className="btn-cta nav-btn" onClick={() => navigate("/write-review")}>
            Viết đánh giá
          </button>
        </nav>
      </header>

      <div className="login-container">
        <form className="login-box" onSubmit={handleLogin}>
          <h2>Đăng nhập hệ thống</h2>
          <div className="input-group">
            {/* Cập nhật Label để thân thiện hơn */}
            <label>Tên đăng nhập hoặc Email</label> 
            <input
              type="text"
              name="username"
              placeholder="Nhập username hoặc email của bạn"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group password-group">
            <label>Mật khẩu</label>
            <div className="password-wrapper" style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </span>
            </div>
          </div>

          <button type="submit" className="login-button">Vào hệ thống</button>
          <p className="switch-text">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
        </form>
      </div>
    </div>
  );
};

export default Login;