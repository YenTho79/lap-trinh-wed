import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminDashboard.css";

const API_BASE = "http://127.0.0.1:8000/api";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch (e) {
      return null;
    }
  });

  const isAdminUser = Boolean(
    currentUser &&
    (
      currentUser.isAdmin === true ||
      currentUser.is_admin === true ||
      currentUser.is_staff === true ||
      currentUser.is_superuser === true ||
      (typeof currentUser.role === "string" &&
        currentUser.role.toLowerCase() === "admin") ||
      (typeof currentUser.vai_tro === "string" &&
        currentUser.vai_tro.toLowerCase() === "admin")
    )
  );

  const [activeTab, setStatusTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const [stats, setStats] = useState({
    totalBooks: 0,
    totalChapters: 0,
    totalUsers: 0,
    totalMessages: 0,
    totalReviews: 0,
    totalStock: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    description: "",
    cover_image: "",
  });

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [selectedBookForChapter, setSelectedBookForChapter] = useState(null);
  const [chapterData, setChapterData] = useState({
    title: "",
    content: "",
    order: 1,
  });

  const [isChapterListModalOpen, setIsChapterListModalOpen] = useState(false);
  const [selectedBookForList, setSelectedBookForList] = useState(null);

  const [editingChapter, setEditingChapter] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
const [selectedBookForView, setSelectedBookForView] = useState(null); // Lưu dữ liệu từ API
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 2500);
  }, []);

  const getAuthConfig = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, []);

  const normalizeArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const config = getAuthConfig();

      const [usersRes, booksRes, chaptersRes, messagesRes, reviewsRes] = await Promise.all([
        axios.get(`${API_BASE}/users/`, config),
        axios.get(`${API_BASE}/books/`, config),
        axios.get(`${API_BASE}/chapters/`, config),
        axios.get(`${API_BASE}/contact-messages/`, config),
        axios.get(`${API_BASE}/reviews/`, config),
      ]);

      const usersData = normalizeArray(usersRes.data);
      const booksData = normalizeArray(booksRes.data);
      const chaptersData = normalizeArray(chaptersRes.data);
      const messagesData = normalizeArray(messagesRes.data);
      const reviewsData = normalizeArray(reviewsRes.data);

      setUsers(usersData);
      setBooks(booksData);
      setChapters(chaptersData);
      setMessages(messagesData);
      setReviews(reviewsData);

      setStats({
        totalBooks: booksData.length,
        totalUsers: usersData.length,
        totalChapters: chaptersData.length,
        totalMessages: messagesData.length,
        totalReviews: reviewsData.length,

        totalStock: booksData.reduce(
          (sum, book) =>
            sum + Number(book.so_luong_ton ?? book.stock ?? book.quantity ?? 0),
          0
        ),
      });
    } catch (err) {
      console.error(
        "Lỗi fetch admin:",
        err.response?.status,
        err.response?.data || err.message
      );

      if (err.response?.status === 401 || err.response?.status === 403) {
        showToast("Phiên đăng nhập không hợp lệ hoặc bạn không có quyền Admin.", "error");
        localStorage.clear();
        navigate("/login");
      } else {
        showToast("Không thể tải dữ liệu quản trị.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthConfig, navigate, showToast]);

  useEffect(() => {
    if (!currentUser || !isAdminUser) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [fetchData, navigate, isAdminUser, currentUser]);

  const bookChapterCounts = useMemo(() => {
    const map = {};
    chapters.forEach((chapter) => {
      const bookId = Number(chapter.book);
      map[bookId] = (map[bookId] || 0) + 1;
    });
    return map;
  }, [chapters]);

  const filteredBooks = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim();
    if (!keyword) return books;

    return books.filter((book) => {
      const bookId = String(book.id || "");
      return (
        (book.title || "").toLowerCase().includes(keyword) ||
        (book.author || "").toLowerCase().includes(keyword) ||
        (book.category || "").toLowerCase().includes(keyword) ||
        bookId.includes(keyword)
      );
    });
  }, [books, searchTerm]);

  const selectedBookChapters = useMemo(() => {
    if (!selectedBookForList) return [];
    const selectedId = Number(selectedBookForList.id);
    return chapters
      .filter((chapter) => Number(chapter.book) === selectedId)
      .sort((a, b) => Number(a.order) - Number(b.order));
  }, [chapters, selectedBookForList]);

  const openModal = (book = null) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title || "",
        author: book.author || "",
        category: book.category || "",
        description: book.description || "",
        cover_image: book.cover_image || "",
      });
    } else {
      setEditingBook(null);
      setFormData({
        title: "",
        author: "",
        category: "",
        description: "",
        cover_image: "",
      });
    }
    setIsModalOpen(true);
  };

  const openChapterModal = (book) => {
    setSelectedBookForChapter(book);
    setEditingChapter(null);
    setChapterData({
      title: "",
      content: "",
      order: (bookChapterCounts[book.id] || 0) + 1,
    });
    setIsChapterModalOpen(true);
  };

  const openEditChapterModal = async (chapter) => {
    try {
      const config = getAuthConfig();
      const res = await axios.get(`${API_BASE}/chapters/${chapter.id}/`, config);

      setEditingChapter(res.data);
      setSelectedBookForChapter(selectedBookForList);
      setChapterData({
        title: res.data.title || "",
        content: res.data.content || "",
        order: res.data.order || 1,
      });
      setIsChapterModalOpen(true);
    } catch (err) {
      console.error("Lỗi lấy chi tiết chương:", err.response?.data || err.message);
      showToast("Không thể tải chi tiết chương.", "error");
    }
  };

  const openChapterListModal = (book) => {
    setSelectedBookForList(book);
    setIsChapterListModalOpen(true);
  };

  const handleSaveBook = async (e) => {
  e.preventDefault();
  try {
    const config = getAuthConfig();
    const data = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      category: formData.category.trim(),
      description: formData.description.trim(),
      cover_image: formData.cover_image.trim(),
    };

    if (editingBook) {
      // Trường hợp Sửa sách: Giữ nguyên logic PUT của bạn
      await axios.put(`${API_BASE}/books/${editingBook.id}/`, data, config);
      showToast("Cập nhật sách thành công!");
    } else {
      // TRƯỜNG HỢP THÊM MỚI: Kiểm tra trùng lặp
      const existedBook = books.find(
        (b) =>
          b.title?.trim().toLowerCase() === data.title.toLowerCase() &&
          b.author?.trim().toLowerCase() === data.author.toLowerCase()
      );

      if (existedBook) {
    // 1. Tính toán số lượng mới
    const currentStock = Number(existedBook.stock) || 0; // Lấy từ DB (key là 'stock')
    const addedAmount = Number(formData.so_luong_ton) || 0; // Lấy từ Form nhập
    const newTotal = currentStock + addedAmount;

    // 2. Gửi lệnh PATCH
    try {
        await axios.patch(
            `${API_BASE}/books/${existedBook.id}/`,
            { stock: newTotal }, // PHẢI dùng key là 'stock'
            getAuthConfig()
        );
        showToast("Đã cộng dồn tồn kho!");
        fetchData(); // Load lại bảng để thấy số mới
    } catch (err) {
        console.error(err);
    }
} else {
    // Khi thêm mới, lấy đúng số lượng đã nhập trong form
    await axios.post(
        `${API_BASE}/books/`,
        { ...data, so_luong_ton: formData.so_luong_ton || 1 },
        config
    );
    showToast("Thêm sách mới thành công!");
}
    }

    // Reset Form và đóng Modal
    setIsModalOpen(false);
    setEditingBook(null);
    setFormData({ title: "", author: "", category: "", description: "", cover_image: "" });
    
    // Đợi fetch lại dữ liệu mới nhất
    await fetchData(); 

  } catch (err) {
    console.error("Lỗi:", err);
    showToast("Không thể lưu dữ liệu", "error");
  }
};

  const handleSaveChapter = async (e) => {
    e.preventDefault();

    if (!selectedBookForChapter) return;

    try {
      const config = getAuthConfig();

      const data = {
        book: selectedBookForChapter.id,
        title: chapterData.title,
        content: chapterData.content,
        order: Number(chapterData.order),
      };

      if (editingChapter) {
        await axios.put(`${API_BASE}/chapters/${editingChapter.id}/`, data, config);
        showToast("Cập nhật chương thành công!");
      } else {
        await axios.post(`${API_BASE}/chapters/`, data, config);
        showToast("Xuất bản chương mới thành công!");
      }

      setIsChapterModalOpen(false);
      setEditingChapter(null);
      setSelectedBookForChapter(null);
      setChapterData({ title: "", content: "", order: 1 });
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu chương:", err.response?.data || err.message);
      const errorMsg = err.response?.data
        ? JSON.stringify(err.response.data)
        : "Lỗi kết nối";
      showToast(`Không thể lưu chương: ${errorMsg}`, "error");
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sách #${bookId}?`)) return;

    try {
      const config = getAuthConfig();
      await axios.delete(`${API_BASE}/books/${bookId}/`, config);
      showToast("Xóa sách thành công!");
      fetchData();
    } catch (err) {
      console.error("Xóa sách thất bại:", err.response?.data || err.message);
      showToast("Xóa sách thất bại!", "error");
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chương #${chapterId}?`)) return;

    try {
      const config = getAuthConfig();
      await axios.delete(`${API_BASE}/chapters/${chapterId}/`, config);
      showToast("Xóa chương thành công!");
      fetchData();
    } catch (err) {
      console.error("Xóa chương thất bại:", err.response?.data || err.message);
      showToast("Xóa chương thất bại!", "error");
    }
  };

  const handleDeleteUser = async (uid) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return;

    try {
      const config = getAuthConfig();
      await axios.delete(`${API_BASE}/users/${uid}/`, config);
      showToast("Đã xóa thành viên!");
      fetchData();
    } catch (err) {
      console.error("Không thể xóa user:", err.response?.data || err.message);
      showToast("Không thể xóa user này!", "error");
    }
  };
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    try {
      const config = getAuthConfig();

      await axios.delete(
        `${API_BASE}/reviews/${reviewId}/`,
        config
      );

      showToast("Xóa đánh giá thành công!");
      fetchData();
    } catch (err) {
      console.error(err);
      showToast("Xóa đánh giá thất bại!", "error");
    }
  };
  const handleViewMessage = (msg) => {
    setSelectedMessage(msg);
  };
  const [selectedReview, setSelectedReview] = useState(null);
  const closeMessageModal = () => {
    setSelectedMessage(null);
  };

  const handleResetSearch = () => {
    setSearchTerm("");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    const onStorage = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem("currentUser")));
      } catch (e) {
        setCurrentUser(null);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (loading) {
    return (
      <div className="admin-loader-container">
        <div className="admin-spinner"></div>
        <p>ĐANG ĐỒNG BỘ HỆ THỐNG...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {toast.show && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <aside className="admin-sidebar reveal">
        <div className="admin-brand">
          <div className="admin-logo-gold">
            <img src="/images/logo.png" alt="Logo" className="admin-logo-img" />
          </div>
          <div className="admin-brand-text">
            <h2 className="gs-gold-text">GÓC SÁCH</h2>
            <span style={{ color: 'var(--gold)', letterSpacing: '2px', fontSize: '10px' }}>LUXURY ADMIN</span>
          </div>
        </div>

        <nav className="admin-menu">
          <p className="menu-section-label">TỔNG QUAN</p>
          <button
            className={`admin-menu-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setStatusTab("dashboard")}
          >
            📊 Bảng điều khiển
          </button>

          <p className="menu-section-label">HỆ THỐNG</p>
          <button
            className={`admin-menu-item ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setStatusTab("users")}
          >
            👥 Thành viên
          </button>
          <button
            className={`admin-menu-item ${activeTab === "books" ? "active" : ""}`}
            onClick={() => setStatusTab("books")}
          >
            📖 Quản lý kho sách
          </button>
          <button
            className={`admin-menu-item ${activeTab === "messages" ? "active" : ""}`}
            onClick={() => setStatusTab("messages")}
          >
            ✉️ Tin nhắn
          </button>
          <button
            className={`admin-menu-item ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setStatusTab("reviews")}
          >
            ⭐ Đánh giá
          </button>

          <button
            className={`admin-menu-item ${activeTab === "stock" ? "active" : ""}`}
            onClick={() => setStatusTab("stock")}
          >
            📦 Tồn kho
          </button>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-btn-link">
            Trang chủ
          </Link>
          <button className="sidebar-btn-logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar reveal">
          <div className="topbar-search">
            <input
              type="text"
              placeholder="Tìm kiếm sách, tác giả, thể loại, mã sách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="admin-user-info">
            <div className="user-details">
              <strong>Quản trị viên</strong>
              <span>{currentUser?.email}</span>
            </div>
            <div className="admin-avatar-circle">AD</div>
          </div>
        </header>

        <div className="admin-scroll-content">
          {activeTab === "dashboard" && (
            <div className="admin-fade-in">
              <div className="admin-stats-row">
                <div className="luxury-stat-card reveal stagger-1">
                  <p>Tổng tác phẩm</p>
                  <h3 className="gs-gold-text">{stats.totalBooks}</h3>
                  <div className="stat-line gold"></div>
                </div>

                <div className="luxury-stat-card reveal stagger-2">
                  <p>Tổng độc giả</p>
                  <h3 className="gs-gold-text">{stats.totalUsers}</h3>
                  <div className="stat-line ink"></div>
                </div>

                <div className="luxury-stat-card reveal stagger-3">
                  <p>Chương đã đăng</p>
                  <h3 className="gs-gold-text">{stats.totalChapters}</h3>
                  <div className="stat-line gold"></div>
                </div>

                <div className="luxury-stat-card reveal stagger-4">
                  <p>Tin nhắn liên hệ</p>
                  <h3 className="gs-gold-text">{stats.totalMessages}</h3>
                  <div className="stat-line ink"></div>
                </div>

                <div className="luxury-stat-card reveal stagger-4">
                  <p>Tổng đánh giá</p>
                  <h3 className="gs-gold-text">{stats.totalReviews}</h3>
                  <div className="stat-line gold"></div>
                </div>

                <div className="luxury-stat-card reveal stagger-4">
                  <p>Tổng tồn kho</p>
                  <h3 className="gs-gold-text">{stats.totalStock}</h3>
                  <div className="stat-line ink"></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="admin-panel reveal">
              <div className="panel-header-luxury">
                <h2 className="gs-gold-text">DANH SÁCH TIN NHẮN LIÊN HỆ</h2>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table-luxury">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Người gửi</th>
                      <th>Email</th>
                      <th>Nội dung</th>
                      <th>Ngày gửi</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {messages.length > 0 ? (
                      messages.map((msg) => (
                        <tr key={msg.message_id}>
                          <td>#{msg.message_id}</td>
                          <td>{msg.sender_name}</td>
                          <td>{msg.sender_email}</td>
                          <td style={{ maxWidth: "220px" }}>
                            {(msg.content || "").length > 40
                              ? `${msg.content.slice(0, 40)}...`
                              : msg.content}
                          </td>
                          <td>{new Date(msg.send_time).toLocaleString("vi-VN")}</td>
                          <td>
                            <button
                              type="button"
                              className="action-link view"
                              onClick={() => handleViewMessage(msg)}
                            >
                              Xem
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                          Chưa có tin nhắn nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "books" && (
            <div className="admin-panel reveal">
              <div className="panel-header-luxury">
                <h2 className="gs-gold-text">DANH SÁCH KHO SÁCH</h2>
                <button className="btn-gold-add" onClick={() => openModal()}>
                  + THÊM SÁCH
                </button>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table-luxury">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Bìa sách</th>
                      <th>Tiêu đề</th>
                      <th>Tác giả</th>
                      <th>Thể loại</th>
                      <th>Số chương</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBooks.length > 0 ? (
                      filteredBooks.map((book) => {
                        const bookId = book.id;
                        const coverSrc = book.cover_image || "/images/covers/default.jpg";
                        const chapterCount = bookChapterCounts[bookId] || 0;

                        return (
                          <tr key={bookId}>
                            <td>#{bookId}</td>
                            <td>
                              <img
                                src={coverSrc}
                                alt={book.title}
                                style={{
                                  width: "48px",
                                  height: "64px",
                                  objectFit: "cover",
                                  borderRadius: "6px",
                                  border: "1px solid rgba(184,149,110,0.2)",
                                }}
                              />
                            </td>
                            <td className="font-playfair">
                              <strong>{book.title}</strong>
                            </td>
                            <td>{book.author || "N/A"}</td>
                            <td>{book.category || "N/A"}</td>
                            <td>
                              <span className={`status-badge ${chapterCount > 0 ? "active" : "draft"}`}>
                                {chapterCount > 0 ? `${chapterCount} Chương` : "Chưa có"}
                              </span>
                            </td>
                            <td>
                              <button
                              className="action-link view"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              onClick={async (e) => {
                                e.preventDefault(); // Chặn chuyển trang
                                try {
                                  const config = getAuthConfig();
                                  // Gọi API lấy dữ liệu chi tiết từ server
                                  const res = await axios.get(`${API_BASE}/books/${book.id}/`, config);
                                  setSelectedBookForView(res.data); // Mở modal với dữ liệu từ API
                                } catch (err) {
                                  showToast("Không thể tải thông tin chi tiết!", "error");
                                }
                              }}
                            >
                              Xem
                            </button>

                              <button
                                className="action-link add-chapter"
                                onClick={() => openChapterModal(book)}
                                style={{ color: "#d4af37", fontWeight: "bold" }}
                              >
                                + Chương
                              </button>

                              <button
                                className="action-link chapters"
                                onClick={() => openChapterListModal(book)}
                              >
                                DS Chương
                              </button>

                              <button
                                className="action-link edit"
                                onClick={() => openModal(book)}
                              >
                                Sửa
                              </button>

                              <button
                                className="action-link delete"
                                onClick={() => handleDeleteBook(bookId)}
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "30px" }}>
                          <div className="admin-empty-state">
                            <p>Không tìm thấy sách phù hợp.</p>
                            <button className="btn-gold-add small" onClick={handleResetSearch}>
                              Xóa bộ lọc
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="admin-panel reveal">
              <div className="panel-header-luxury">
                <h2 className="gs-gold-text">DANH SÁCH ĐÁNH GIÁ</h2>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table-luxury">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Sách</th>
                      <th>Tiêu đề</th>
                      <th>Số sao</th>
                      <th>Nội dung</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reviews.map((review) => (
                      <tr key={review.id}>
                        <td>#{review.id}</td>
                        <td>{review.book}</td>
                        <td>{review.review_title}</td>
                        <td>⭐ {review.stars}</td>
                        <td>
                          {review.review_body?.length > 30
                            ? `${review.review_body.slice(0, 30)}...`
                            : review.review_body}
                        </td>

                        <td>
                          <button
                            className="action-link view"
                            onClick={() => setSelectedReview(review)}
                          >
                            Xem
                          </button>

                          <button
                            className="action-link delete"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "users" && (
            <div className="admin-panel reveal">
              <div className="panel-header-luxury">
                <h2 className="gs-gold-text">QUẢN LÝ THÀNH VIÊN</h2>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table-luxury">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên đăng nhập</th>
                      <th>Email</th>
                      <th>Vai trò</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.length > 0 ? (
                      users.map((u) => {
                        const uid = u.uid;
                        const isAdminRole = String(u.role || "").toLowerCase() === "admin";

                        return (
                          <tr key={uid}>
                            <td>#{uid}</td>
                            <td>{u.username || "N/A"}</td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`role-badge ${isAdminRole ? "admin" : "user"}`}>
                                {isAdminRole ? "Quản trị viên" : "Thành viên"}
                              </span>
                            </td>
                            <td>
                              {u.email !== currentUser?.email && (
                                <button
                                  className="action-link delete"
                                  onClick={() => handleDeleteUser(uid)}
                                >
                                  Xóa tài khoản
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>
                          Chưa có người dùng nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "stock" && (
            <div className="admin-panel reveal">
              <div className="panel-header-luxury">
                <h2 className="gs-gold-text">
                  DANH SÁCH TỒN KHO
                </h2>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table-luxury">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Bìa sách</th>
                      <th>Tên sách</th>
                      <th>Tác giả</th>
                      <th>Thể loại</th>
                      <th>Số lượng tồn</th>
                    </tr>
                  </thead>

                  <tbody>
                    {books.map((book) => (
                      <tr key={book.id}>
                        <td>#{book.id}</td>

                        <td>
                          <img
                            src={book.cover_image || "/images/covers/default.jpg"}
                            alt={book.title}
                            style={{
                              width: "48px",
                              height: "64px",
                              objectFit: "cover",
                              borderRadius: "6px",
                            }}
                          />
                        </td>

                        <td>
                          <strong>{book.title}</strong>
                        </td>

                        <td>{book.author || "N/A"}</td>

                        <td>{book.category || "N/A"}</td>

                        <td>
                          <span className="status-badge active">
                            {book.so_luong_ton ?? book.stock ?? book.quantity ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="luxury-modal-overlay">
          <div className="luxury-modal-card">
            <div className="modal-header-gold">
              <h3>{editingBook ? "CẬP NHẬT SÁCH" : "THÊM SÁCH MỚI"}</h3>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="luxury-form">
  {/* Tên sách - Full hàng */}
  <div className="input-group">
    <label>Tiêu đề sách</label>
    <input
      type="text"
      required
      placeholder="Nhập tên sách..."
      value={formData.title}
      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
    />
  </div>

  {/* Tác giả, Thể loại & Số lượng - Chia 3 cột */}
  <div className="input-row-flex">
    <div className="input-group flex-1">
      <label>Tác giả</label>
      <input
        type="text"
        placeholder="Tên tác giả"
        value={formData.author}
        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
      />
    </div>
    <div className="input-group flex-1">
      <label>Thể loại</label>
      <input
        type="text"
        placeholder="Phiêu lưu..."
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      />
    </div>
    <div className="input-group flex-1">
      <label>Số lượng nhập</label>
      <input
        type="number"
        min="1"
        /* Đổi từ .stock sang .so_luong_ton cho khớp DB */
        value={formData.so_luong_ton || 1} 
        onChange={(e) => setFormData({ ...formData, so_luong_ton: parseInt(e.target.value) || 1 })}
      />
    </div>
  </div>

  {/* Link ảnh bìa & Preview */}
  <div className="input-group">
    <label>Link ảnh bìa</label>
    <div className="input-with-preview" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}> 
      <input
        type="text"
        placeholder="Dán link ảnh tại đây..."
        style={{ flex: 1 }}
        value={formData.cover_image}
        onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
      />
      {formData.cover_image && (
        <div className="mini-preview-wrapper" style={{ width: '50px', height: '65px', borderRadius: '8px', border: '2px solid var(--admin-gold)', overflow: 'hidden', flexShrink: 0 }}>
          <img 
            src={formData.cover_image} 
            alt="Preview" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => e.target.src = "https://via.placeholder.com/50x70?text=Lỗi"}
          />
        </div>
      )}
    </div>
  </div>

  {/* Mô tả sách */}
  <div className="input-group">
    <label>Mô tả sách</label>
    <textarea
      className="luxury-textarea"
      rows="4"
      style={{ height: '120px' }}
      placeholder="Nhập nội dung tóm tắt của sách..."
      value={formData.description}
      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
    />
  </div>

  {/* Footer Buttons */}
  <div className="modal-footer-btns">
    <button type="submit" className="btn-luxury-save">
      {formData.id ? "CẬP NHẬT THÔNG TIN" : "LƯU DỮ LIỆU SÁCH"}
    </button>
    <button
      type="button"
      className="btn-luxury-cancel"
      onClick={() => setIsModalOpen(false)}
    >
      HỦY BỎ
    </button>
  </div>
</form>
          </div>
        </div>
      )}

      {isChapterModalOpen && (
        <div className="luxury-modal-overlay">
          <div className="luxury-modal-card chapter-modal">
            <div className="modal-header-gold">
              <h3>
                {editingChapter
                  ? `SỬA CHƯƠNG: ${selectedBookForChapter?.title}`
                  : `VIẾT CHƯƠNG MỚI: ${selectedBookForChapter?.title}`}
              </h3>
              <button
                className="close-modal"
                onClick={() => {
                  setIsChapterModalOpen(false);
                  setEditingChapter(null);
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="luxury-form">
              <div className="input-row-flex">
                <div className="input-group flex-3">
                  <label>Tiêu đề chương</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Chương 1: Sự khởi đầu"
                    value={chapterData.title}
                    onChange={(e) =>
                      setChapterData({ ...chapterData, title: e.target.value })
                    }
                  />
                </div>

                <div className="input-group flex-1">
                  <label>Số thứ tự</label>
                  <input
                    type="number"
                    required
                    value={chapterData.order}
                    onChange={(e) =>
                      setChapterData({ ...chapterData, order: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Nội dung chương</label>
                <textarea
                  required
                  className="luxury-textarea"
                  rows="15"
                  placeholder="Nhập nội dung câu chuyện tại đây..."
                  value={chapterData.content}
                  onChange={(e) =>
                    setChapterData({ ...chapterData, content: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="modal-footer-btns">
                <button type="submit" className="btn-luxury-save">
                  {editingChapter ? "CẬP NHẬT CHƯƠNG" : "XUẤT BẢN CHƯƠNG"}
                </button>
                <button
                  type="button"
                  className="btn-luxury-cancel"
                  onClick={() => {
                    setIsChapterModalOpen(false);
                    setEditingChapter(null);
                  }}
                >
                  HỦY BỎ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isChapterListModalOpen && (
        <div className="luxury-modal-overlay">
          <div className="luxury-modal-card chapter-list-modal">
            <div className="modal-header-gold">
              <h3>DANH SÁCH CHƯƠNG: {selectedBookForList?.title}</h3>
              <button
                className="close-modal"
                onClick={() => setIsChapterListModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="luxury-form">
              {selectedBookChapters.length > 0 ? (
                <div className="admin-chapter-list">
                  {selectedBookChapters.map((chapter) => (
                    <div key={chapter.id} className="admin-chapter-item">
                      <div className="admin-chapter-meta">
                        <strong>Chương {chapter.order}</strong>
                        <span>{chapter.title}</span>
                      </div>

                      <div className="admin-chapter-actions">
                        <Link
                          to={`/read/${selectedBookForList?.id}/${chapter.id}`}
                          className="action-link view"
                          style={{ textDecoration: "none" }}
                        >
                          Đọc
                        </Link>
                        <button
                          className="action-link edit"
                          onClick={() => openEditChapterModal(chapter)}
                        >
                          Sửa
                        </button>
                        <button
                          className="action-link delete"
                          onClick={() => handleDeleteChapter(chapter.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-empty-state">
                  <p>Sách này chưa có chương nào.</p>
                  <button
                    className="btn-gold-add small"
                    onClick={() => {
                      setIsChapterListModalOpen(false);
                      openChapterModal(selectedBookForList);
                    }}
                  >
                    + Thêm chương đầu tiên
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* MODAL HIỂN THỊ CHI TIẾT TÁC PHẨM */}
{selectedBookForView && (
  <div className="luxury-modal-overlay" onClick={() => setSelectedBookForView(null)}>
    <div className="luxury-modal-card view-mode" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden' }}>
      
      {/* Header Modal - Dựa theo ảnh mẫu */}
      <div className="modal-header-gold" style={{ background: '#1a1a1a', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#d4af37', margin: 0, letterSpacing: '2px', fontSize: '1.2rem', fontWeight: 'bold' }}>CHI TIẾT TÁC PHẨM</h3>
        <button 
          onClick={() => setSelectedBookForView(null)} 
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
        >
          &times;
        </button>
      </div>

      <div className="modal-body-content" style={{ display: 'flex', padding: '40px', gap: '40px' }}>
        {/* Phần Ảnh Bìa */}
        <div className="view-cover-section">
          <img 
            src={selectedBookForView.anh_bia || selectedBookForView.cover_image || "/images/covers/default.jpg"} 
            alt="Bìa sách" 
            style={{ 
              width: '280px', 
              borderRadius: '12px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              objectFit: 'cover'
            }} 
          />
        </div>

        {/* Phần Thông Tin Chi Tiết */}
        <div className="view-info-section" style={{ flex: 1, textAlign: 'left' }}>
          <h1 style={{ 
            fontFamily: "'Playfair Display', serif", 
            fontSize: '3.5rem', 
            color: '#c5a37d', 
            margin: '0 0 10px 0',
            lineHeight: '1.1'
          }}>
            {selectedBookForView.tieu_de || selectedBookForView.title}
          </h1>

          <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '20px' }}>
            <strong>Tác giả:</strong> {selectedBookForView.tac_gia || selectedBookForView.author || "Đang cập nhật"}
          </p>

          <div style={{ marginBottom: '30px' }}>
            <span style={{ 
              backgroundColor: '#f0f9f7', 
              color: '#34a853', 
              padding: '8px 15px', 
              borderRadius: '5px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              {selectedBookForView.so_luong_ton || selectedBookForView.stock || 0} cuốn
            </span>
          </div>

          <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '20px' }}>
            <p style={{ 
              color: '#888', 
              lineHeight: '1.6', 
              fontSize: '1rem',
              fontStyle: 'italic'
            }}>
              {selectedBookForView.mo_ta || selectedBookForView.description || "Chưa có mô tả nội dung cho tác phẩm này."}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Modal */}
      <div style={{ padding: '20px', borderTop: '1px solid #eee', textAlign: 'right' }}>
        <button 
          className="btn-close-luxury"
          onClick={() => setSelectedBookForView(null)}
          style={{ 
            background: 'none', 
            border: '2px solid #000', 
            padding: '8px 25px', 
            borderRadius: '20px', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          ĐÓNG
        </button>
      </div>
    </div>
  </div>
)}
      {selectedMessage && (
        <div className="luxury-modal-overlay">
          <div className="luxury-modal-card">
            <div className="modal-header-gold">
              <h3>CHI TIẾT TIN NHẮN</h3>
              <button className="close-modal" onClick={closeMessageModal}>
                &times;
              </button>
            </div>

            <div className="luxury-form">
              <p><strong>Người gửi:</strong> {selectedMessage.sender_name}</p>
              <p><strong>Email:</strong> {selectedMessage.sender_email}</p>
              <p>
                <strong>Ngày gửi:</strong>{" "}
                {new Date(selectedMessage.send_time).toLocaleString("vi-VN")}
              </p>

              <div className="input-group">
                <label>Nội dung</label>
                <div
                  style={{
                    padding: "14px",
                    background: "#fff",
                    borderRadius: "10px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedMessage.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedReview && (
        <div className="luxury-modal-overlay">
          <div className="luxury-modal-card">
            <div className="modal-header-gold">
              <h3>CHI TIẾT ĐÁNH GIÁ</h3>

              <button
                className="close-modal"
                onClick={() => setSelectedReview(null)}
              >
                &times;
              </button>
            </div>

            <div className="luxury-form">
              <p><strong>Tiêu đề:</strong> {selectedReview.review_title}</p>

              <p><strong>Số sao:</strong> ⭐ {selectedReview.stars}</p>

              <div className="input-group">
                <label>Nội dung đánh giá</label>

                <div
                  style={{
                    padding: "14px",
                    background: "#fff",
                    borderRadius: "10px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedReview.review_body}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;