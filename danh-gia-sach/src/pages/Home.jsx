import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getTheme, setTheme } from "../utils/theme";
import "./Home.css";
import { FaStar, FaRegStar, FaStarHalfAlt, FaSearch } from "react-icons/fa";
import Footer from "../components/Footer";
import { FaBars, FaTimes } from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkModeState] = useState(getTheme());
  const [currentUser, setCurrentUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // States cho lọc và dữ liệu
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [apiBooks, setApiBooks] = useState([]);
  const [reviewStats, setReviewStats] = useState({}); // { bookId: { avg, count } }
  const [loading, setLoading] = useState(true);

  // State liên hệ
  const [contactForm, setContactForm] = useState({
    ten_nguoi_gui: "",
    email_nguoi_gui: "",
    noi_dung: "",
  });
  const [contactMessage, setContactMessage] = useState("");

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    password: "",
    avatar: "",
  });

  const handleOpenEditProfile = () => {
    setProfileForm({
      username: currentUser?.username || currentUser?.ten_dang_nhap || "",
      email: currentUser?.email || "",
      password: "",
      avatar: currentUser?.link_anh_dai_dien || "",
    });

    setShowEditProfile(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const userId =
        currentUser?.uid ||
        currentUser?.id ||
        currentUser?.ma_nguoi_dung;

      const payload = {
        username: profileForm.username,
        email: profileForm.email,
        role: currentUser?.role || currentUser?.vai_tro || "user",
      };

      if (profileForm.password.trim()) {
        payload.password = profileForm.password;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Lỗi API trả về:", errorData);
        alert(JSON.stringify(errorData));
        return;
      }

      const updatedUser = await response.json();

      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setShowEditProfile(false);

      alert("Cập nhật thông tin thành công!");
    } catch (error) {
      alert(error.message);
    }
  };
  // 1. Hàm lấy dữ liệu sách - Dùng useCallback để tránh cảnh báo missing dependency
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (category) query.append("category", category);

      const [booksRes, reviewsRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/books/?${query.toString()}`),
        fetch("http://127.0.0.1:8000/api/reviews/")
      ]);
      const booksData = await booksRes.json();
      const reviewsData = await reviewsRes.json();

      setApiBooks(booksData);

      // Tính điểm trung bình và số lượt đánh giá cho từng sách
      const stats = {};
      const reviewsList = Array.isArray(reviewsData) ? reviewsData : [];
      reviewsList.forEach((r) => {
        const bid = r.book;
        if (!stats[bid]) stats[bid] = { total: 0, count: 0 };
        stats[bid].total += Number(r.stars || 0);
        stats[bid].count += 1;
      });
      // Tính avg
      Object.keys(stats).forEach((bid) => {
        stats[bid].avg = (stats[bid].total / stats[bid].count).toFixed(1);
      });
      setReviewStats(stats);
    } catch (error) {
      console.error("Lỗi gọi API:", error);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  // Debounce gọi API khi người dùng nhập liệu
  useEffect(() => {
    const timeoutId = setTimeout(fetchPosts, 500);
    return () => clearTimeout(timeoutId);
  }, [fetchPosts]);

  // 2. Quản lý Theme & Auth
  useEffect(() => {
    setTheme(darkMode);
  }, [darkMode]);

  // Đồng bộ User từ LocalStorage
  useEffect(() => {
    const syncCurrentUser = () => {
      try {
        const stored = localStorage.getItem("currentUser");
        setCurrentUser(stored ? JSON.parse(stored) : null);
      } catch (err) {
        setCurrentUser(null);
      }
    };
    syncCurrentUser();
    window.addEventListener("storage", syncCurrentUser);
    return () => window.removeEventListener("storage", syncCurrentUser);
  }, [location]);

  const [showProfile, setShowProfile] = useState(false);

  // Phân quyền Admin
  const isAdmin = Boolean(
    currentUser && (
      currentUser.isAdmin || currentUser.is_admin || currentUser.is_staff ||
      currentUser.role?.toLowerCase() === 'admin' || currentUser.vai_tro?.toLowerCase() === 'admin'
    )
  );

  const displayName = currentUser?.username || currentUser?.display_name || currentUser?.email;

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setCurrentUser(null);
    alert("Đã đăng xuất");
    navigate("/");
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        sender_name: contactForm.ten_nguoi_gui,
        sender_email: contactForm.email_nguoi_gui,
        content: contactForm.noi_dung
      };
      const response = await fetch("http://127.0.0.1:8000/api/contact-messages/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Gửi thất bại");
      setContactMessage("Gửi tin nhắn thành công!");
      setContactForm({ ten_nguoi_gui: "", email_nguoi_gui: "", noi_dung: "" });
    } catch (error) {
      setContactMessage(error.message);
    }
  };

  return (
    <div className={`home-body ${darkMode ? "dark-mode" : ""}`}>
      <header className="home-header">
        <div className="logo">
          <Link to="/">
            <img src="/images/logo.png" alt="Góc Sách" style={{ height: "45px" }} />
          </Link>
        </div>
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <nav className={`nav-links ${menuOpen ? "active" : ""}`}>
          <a href="#sach" onClick={() => setMenuOpen(false)}>
            Sách
          </a>
          <a href="#lienhe" onClick={() => setMenuOpen(false)}>
            Liên hệ
          </a>
          <Link to="/borrows" onClick={() => setMenuOpen(false)}>
            Mượn sách
          </Link>
          <Link to="/write-review" className="btn-cta nav-btn" onClick={() => setMenuOpen(false)}>
            Viết đánh giá
          </Link>

          {isAdmin && (
            <Link to="/admin" className="admin-link" style={{ fontWeight: 700, color: "var(--gold)" }}>
              Admin
            </Link>
          )}

          {!currentUser ? (
            <Link to="/login">Đăng nhập</Link>
          ) : (
            <>
              <div className="profile-group">
                <div className="profile-menu-wrapper">
                  <button
                    className="profile-avatar"
                    onClick={() => setShowProfile(!showProfile)}
                  >
                    {displayName?.charAt(0).toUpperCase() || "U"}
                  </button>

                  {showProfile && (
                    <div className="profile-dropdown">
                      <h4>Thông tin người dùng</h4>

                      <div className="profile-item">
                        <strong>Tên:</strong> {currentUser?.username}
                      </div>

                      <div className="profile-item">
                        <strong>Email:</strong> {currentUser?.email}
                      </div>

                      <div className="profile-item">
                        <strong>Vai trò:</strong>
                        {isAdmin ? " Admin" : " Người dùng"}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="profile-dropdown-btn"
                  onClick={handleOpenEditProfile}
                >
                  ⌄
                </button>
              </div>
              <button className="logout-btn" onClick={handleLogout}>Đăng xuất</button>
            </>
          )}
          {showEditProfile && (
            <div className="profile-edit-overlay">
              <form className="profile-edit-form" onSubmit={handleUpdateProfile} style={{ position: 'relative' }}>
                {/* Nút X đóng form */}
                <button
                  type="button"
                  className="profile-close-x"
                  onClick={() => setShowEditProfile(false)}
                  aria-label="Close"
                >
                  &times;
                </button>

                <h3>Chỉnh sửa thông tin</h3>

                <label>Tên đăng nhập</label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, username: e.target.value })
                  }
                />

                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                />

                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="Bỏ trống nếu không đổi"
                  value={profileForm.password}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, password: e.target.value })
                  }
                />

                <div className="profile-edit-actions">
                  <button type="submit">Lưu thay đổi</button>
                  <button type="button" onClick={() => setShowEditProfile(false)}>
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}
          <button className="theme-toggle" onClick={() => setDarkModeState(!darkMode)}>
            <span className="theme-icon">{darkMode ? "☀️" : "🌙"}</span>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="gs-hero">
        <div className="gs-hero-overlay"></div>
        <div className="gs-hero-container">
          <div className="gs-hero-content reveal">
            <div className="gs-hero-badge reveal stagger-1"><span>Tủ sách tri thức</span></div>
            <h1 className="gs-hero-title reveal stagger-2">GÓC SÁCH</h1>
            <span className="gs-gold-text reveal stagger-3">KỂ CHUYỆN VĂN CHƯƠNG</span>
            <p className="gs-hero-description reveal stagger-4">Mượn sách dễ dàng - Đọc sách văn minh. Mỗi cuốn sách là một thế giới mới.</p>
            <div className="gs-hero-actions reveal stagger-4">
              <a href="#sach" className="btn-gs-primary">Khám phá sách</a>
              <button className="btn-gs-secondary" onClick={() => navigate("/borrows")}>Mượn sách ngay</button>
            </div>
          </div>
        </div>
      </section>

      {/* Books Section */}
      <section className="books-section" id="sach">
        <div className="section-header reveal">
          <p className="section-label">Thư viện</p>
          <h2 className="section-title">Sách mới nhất</h2>
          <div className="deco-line"></div>
        </div>

        {/* BỘ LỌC (SEARCH & CATEGORY) */}
        <div className="gs-filter-bar reveal">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm tên sách hoặc tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="category-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Tất cả thể loại</option>
            <option value="Văn học">Văn học</option>
            <option value="Kinh tế">Kinh tế</option>
            <option value="Tâm lý">Tâm lý</option>
            <option value="Kỹ năng">Kỹ năng</option>
          </select>
        </div>

        <div className="books-grid">
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--gold)", gridColumn: "1/-1" }}>Đang mở kho sách...</p>
          ) : apiBooks.length > 0 ? (
            apiBooks.map((book) => {
              const bookId = book.id ?? book.post_id;
              const coverRaw = book.cover_image || book.image || book.cover_filename;
              const coverSrc = coverRaw
                ? (/^https?:\/\//i.test(coverRaw) ? coverRaw : `/images/covers/${coverRaw}`)
                : '/images/covers/default.jpg';
              // Ưu tiên dùng dữ liệu từ API reviews, fallback về books table
              const stat = reviewStats[bookId];
              const r = stat ? Number(stat.avg) : Number(book.avg_rating || 0);
              const reviewCount = stat ? stat.count : (book.total_reviews || 0);

              return (
                <div className="book-card reveal" key={bookId}>
                  <Link to={`/book/${bookId}`} className="book-link">
                    <div className="book-cover">
                      <img src={coverSrc} alt={book.title} />
                      <div className="cover-overlay"><span>Xem chi tiết</span></div>
                    </div>
                  </Link>
                  <div className="book-info-wrapper">
                    <h4 className="book-title">{book.title}</h4>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((i) => (
                        r >= i ? <FaStar key={i} color="#facc15" /> :
                          r >= i - 0.5 ? <FaStarHalfAlt key={i} color="#facc15" /> :
                            <FaRegStar key={i} color="#facc15" />
                      ))}
                    </div>
                    <p className="book-meta">
                      {r > 0 ? `Điểm: ${r}` : ""}
                      {reviewCount > 0 ? ` • ${reviewCount} đánh giá` : ""}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: "center", color: "var(--gold)", gridColumn: "1/-1" }}>Không tìm thấy sách phù hợp.</p>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="lienhe">
        <div className="section-header reveal">
          <p className="section-label">Kết nối</p>
          <h2 className="section-title" style={{ color: "var(--cream)" }}>Liên hệ với chúng tôi</h2>
        </div>

        <div className="contact-grid">
          <div className="contact-card reveal">
            <h3>Thông tin liên lạc</h3>
            <div className="contact-info">
              <p><i className="fas fa-map-marker-alt"></i> 504 Đại lộ Bình Dương, TP.HCM</p>
              <p><i className="fas fa-phone"></i> 1900 1500</p>
              <p><i className="fas fa-envelope"></i> Nhom3@BDU.com</p>
            </div>
          </div>

          <div className="contact-card">
            <h3>Gửi tin nhắn</h3>
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <input type="text" placeholder="Họ và tên" value={contactForm.ten_nguoi_gui} onChange={(e) => setContactForm({ ...contactForm, ten_nguoi_gui: e.target.value })} required />
              <input type="email" placeholder="Email" value={contactForm.email_nguoi_gui} onChange={(e) => setContactForm({ ...contactForm, email_nguoi_gui: e.target.value })} required />
              <textarea placeholder="Nội dung..." value={contactForm.noi_dung} onChange={(e) => setContactForm({ ...contactForm, noi_dung: e.target.value })} required></textarea>
              <button type="submit">Gửi tin nhắn</button>
              {contactMessage && <p className="msg-status">{contactMessage}</p>}
            </form>
          </div>

          <div className="contact-card reveal">
            <h3>Vị trí</h3>
            <div className="map-wrapper">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.42066399059!2d106.680632!3d10.855584!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529d20c35599d%3A0x63353e6f9d511370!2zNTA0IMSQ4bqhaSBs4buZIELDrG5oIETGsMahbmcsIEhp4buHcCBUaMOgbmgsIFRo4bunIEThuqd1IE3hu5l0LCBCw6xuaCBExrDGoW5n!5e0!3m2!1svi!2s!4v1700000000000" width="100%" height="100%" title="map" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div >
  );
};

export default Home;