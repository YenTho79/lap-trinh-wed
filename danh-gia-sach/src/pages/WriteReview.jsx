import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { getTheme, setTheme } from "../utils/theme";
import "./WriteReview.css";
import axios from "axios";

const WriteReview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [darkMode, setDarkModeState] = useState(getTheme());

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const bookIdFromUrl = searchParams.get("bookId");

  const [books, setBooks] = useState([]);

  const [formData, setFormData] = useState({
    reviewTitle: "",
    bookId: "",
    bookTitle: "",
    reviewerName: currentUser?.email || "",
    reviewText: ""
  });

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    setTheme(darkMode);

    const savedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!savedUser) {
      alert("Bạn cần đăng nhập trước.");
      navigate("/login");
    }
  }, [darkMode, navigate]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/books/");
        const booksData = Array.isArray(res.data) ? res.data : [];
        setBooks(booksData);

        if (bookIdFromUrl) {
          const found = booksData.find(
            (book) => String(book.id) === String(bookIdFromUrl)
          );

          if (found) {
            setFormData((prev) => ({
              ...prev,
              bookId: found.id,
              bookTitle: found.title
            }));
          }
        }
      } catch (error) {
        console.error("Lỗi tải danh sách sách:", error);
        setBooks([]);
      }
    };

    fetchBooks();
  }, [bookIdFromUrl]);

  const selectedBook = useMemo(() => {
    return books.find(
      (book) => String(book.id) === String(formData.bookId)
    ) || null;
  }, [books, formData.bookId]);

  const handleChange = (e) => {
    const { id, value } = e.target;

    if (id === "bookTitle") {
      const foundBook = books.find((book) => String(book.id) === String(value));
      setFormData((prev) => ({
        ...prev,
        bookTitle: foundBook?.title || "",
        bookId: value,
      }));
      return; // Dừng lại ở đây, không để bị ghi đè bên dưới
    }

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.reviewTitle || !formData.bookId || !formData.reviewText) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (formData.reviewText.trim().length > 1000) {
      alert("Nội dung đánh giá không được vượt quá 1000 ký tự.");
      return;
    }

    if (rating === 0) {
      alert("Vui lòng để lại đánh giá sao.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "http://127.0.0.1:8000/api/reviews/",
        {
          book: Number(formData.bookId),
          review_title: formData.reviewTitle,
          review_body: formData.reviewText,
          stars: Number(rating)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Cảm ơn bạn! Bài đánh giá đã được gửi thành công.");
      navigate(`/book/${formData.bookId}`);
    } catch (error) {
      console.error("Lỗi gửi đánh giá:", error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : "Gửi đánh giá thất bại!";
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="write-review-container">
      <header className="review-header">
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
          <Link to="/">Trang chủ</Link>
          <Link to="/login">Đăng nhập</Link>

          <button
            type="button"
            className="theme-toggle"
            onClick={() => setDarkModeState((prev) => !prev)}
            aria-label="Đổi giao diện sáng tối"
            title={darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          >
            <span className="theme-icon">{darkMode ? "☀️" : "🌙"}</span>
          </button>
        </nav>
      </header>

      <section className="page-hero">
        <div className="hero-content">
          <span className="hero-badge">Góc đánh giá</span>
          <h1>
            Chia sẻ <em>cảm nhận</em> của bạn
          </h1>
          <p className="hero-subtitle">
            Viết đánh giá cho cuốn sách bạn yêu thích.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="section-header">
          <p className="section-label">Thông tin sách đang đánh giá</p>
          <h2 className="section-title">Sách được chọn</h2>
        </div>

        <div className="form-grid">
          <div className="form-card selected-book-card">
            {selectedBook ? (
              <div className="selected-book-info">
                <img
                  src={selectedBook.cover_image || selectedBook.image}
                  alt={selectedBook.title}
                  className="selected-book-image"
                />

                <div className="selected-book-content">
                  <h3>{selectedBook.title}</h3>
                  <p>
                    <strong>Tác giả:</strong> {selectedBook.author}
                  </p>
                  <p>{selectedBook.description}</p>
                </div>
              </div>
            ) : (
              <div className="empty-selected-book">
                <p>Chưa chọn sách cụ thể.</p>
                <span>
                  Hãy chọn một cuốn sách ở form bên dưới để xem thông tin chi tiết.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="page-section" id="review-form">
        <div className="section-header">
          <p className="section-label">Bài đánh giá của bạn</p>
          <h2 className="section-title">Gửi đánh giá của bạn</h2>
        </div>

        <div className="form-grid">
          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-field">
                  <label htmlFor="reviewTitle">Tiêu đề bài viết</label>
                  <input
                    type="text"
                    id="reviewTitle"
                    placeholder="Ví dụ: Một chuyến phiêu lưu khó quên"
                    value={formData.reviewTitle}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-field">
                  <label htmlFor="bookId">Tên sách</label>
                  <select
                    id="bookId"
                    value={formData.bookId}
                    onChange={(e) => {
                      const bid = e.target.value;
                      const found = books.find(b => String(b.id) === String(bid));
                      setFormData({
                        ...formData,
                        bookId: bid,
                        bookTitle: found ? found.title : ""
                      });
                    }}
                    required
                  >
                    <option value="">-- Chọn sách --</option>
                    {books.map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-field">
                  <label htmlFor="reviewerName">Người đánh giá</label>
                  <input
                    type="text"
                    id="reviewerName"
                    value={formData.reviewerName}
                    readOnly
                  />
                </div>

                <div className="input-field">
                  <label>Đánh giá sao</label>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          (hover || rating) >= star
                            ? "fas fa-star active"
                            : "far fa-star"
                        }
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                      ></span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="input-field full-width">
                <label htmlFor="reviewText">Nội dung chi tiết</label>
                <textarea
                  id="reviewText"
                  placeholder="Chia sẻ cảm nhận của bạn (tối đa 1000 ký tự)..."
                  value={formData.reviewText}
                  onChange={handleChange}
                  maxLength="1000"
                  required
                ></textarea>

                <div className="char-count">
                  Đã nhập:{" "}
                  <span
                    style={{
                      color: formData.reviewText.length > 1000 ? "red" : "var(--gold)"
                    }}
                  >
                    {formData.reviewText.length}
                  </span>
                  /1000 ký tự tối đa
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Đang gửi..." : "Đăng bài đánh giá"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    formData.bookId
                      ? navigate(`/book/${formData.bookId}`)
                      : navigate("/")
                  }
                  className="btn btn-ghost"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WriteReview;