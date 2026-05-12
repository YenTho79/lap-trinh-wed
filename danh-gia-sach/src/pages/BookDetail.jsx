import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getTheme, setTheme } from "../utils/theme";
import { getBookDetail } from "../services/bookService";
import "./BookDetail.css";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import Footer from "../components/Footer";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [darkMode, setDarkModeState] = useState(getTheme());
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBorrowForm, setShowBorrowForm] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const token = localStorage.getItem("token");

  const isAdmin = currentUser?.role?.toLowerCase() === "admin" || currentUser?.isAdmin === true;
  const isBlacklisted = currentUser?.status === "DanhSachDen" || currentUser?.is_blacklisted === true;

  const [borrowForm, setBorrowForm] = useState({
    borrower_name: currentUser?.displayName || currentUser?.username || currentUser?.email || "",
    borrow_date: new Date().toISOString().split("T")[0],
    due_date: "",
    condition_borrow: "Nguyên vẹn",
    borrow_image: "",
    note: "",
  });

  useEffect(() => {
    setTheme(darkMode);
  }, [darkMode]);

  useEffect(() => {
    let mounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await getBookDetail(id);
        if (!mounted) return;
        setBook(data);
        const rv = await fetch(`http://127.0.0.1:8000/api/reviews/?book=${id}`);
        const rvData = await rv.json();
        setReviews(Array.isArray(rvData) ? rvData : []);
        const cp = await fetch(`http://127.0.0.1:8000/api/books/${id}/chapters/`);
        const cpData = await cp.json();
        setChapters(Array.isArray(cpData) ? cpData : []);
      } catch (err) {
        console.error("Lỗi:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDetail();
    return () => (mounted = false);
  }, [id]);

  const submitBorrowOnline = async (e) => {
    e.preventDefault();
    if (!currentUser) return navigate("/login");
    if (isBlacklisted) return alert("Bạn đang bị chặn mượn sách!");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/borrows/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user: currentUser.uid || currentUser.id,
          book: Number(book.id),
          borrower_name: borrowForm.borrower_name,
          book_name: book.title,
          borrow_date: borrowForm.borrow_date,
          due_date: borrowForm.due_date,
          status: "ChoDuyet",
          condition_borrow: borrowForm.condition_borrow,
          borrow_image: borrowForm.borrow_image,
          note: borrowForm.note,
        }),
      });

      if (response.ok) {
        alert("Gửi yêu cầu thành công!");
        setShowBorrowForm(false);
        navigate("/borrows");
      }
    } catch (err) {
      alert("Lỗi kết nối.");
    }
  };

  const averageRating = useMemo(() => {
    if (book?.avg_rating) return Number(book.avg_rating).toFixed(1);
    if (!reviews.length) return 0;
    return (reviews.reduce((sum, r) => sum + Number(r.stars), 0) / reviews.length).toFixed(1);
  }, [reviews, book]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push(<FaStar key={i} color="gold" />);
      else if (rating >= i - 0.5) stars.push(<FaStarHalfAlt key={i} color="gold" />);
      else stars.push(<FaRegStar key={i} color="gold" />);
    }
    return stars;
  };

  if (loading) return <div>Đang tải...</div>;
  if (!book) return <div>Không tìm thấy sách.</div>;

  return (
    <div className="book-detail-page">
      <div className="book-detail-container">
        <div className="book-detail-topbar">
          <Link to="/" className="book-home-link">← Trang chủ</Link>
          <button className="theme-toggle" onClick={() => setDarkModeState(!darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <section className="book-hero-card reveal">
          <div className="book-cover-wrap">
            <img src={book.cover_image || "/default-book.png"} alt={book.title} />
          </div>
          <div className="book-main-info">
            <h1 className="gs-gold-text">{book.title}</h1>
            <p>Tác giả: <strong>{book.author}</strong></p>
            <p>Thể loại: <span className="book-category-tag">{book.category || "Chưa phân loại"}</span></p>
            <p>Số lượng còn: <strong style={{color: book.stock > 0 ? '#52c41a' : '#ff4d4f'}}>{book.stock} cuốn</strong></p>
            <p>Đánh giá: {renderStars(Number(averageRating))} ({averageRating})</p>
            <p className="book-main-description">{book.description}</p>

            <div className="book-action-row">
              {chapters.length > 0 ? (
                <Link to={`/read/${book.id}/${chapters[0].id}`} className="book-btn book-btn-primary">Đọc ngay</Link>
              ) : (
                <button className="book-btn book-btn-primary" disabled>Sắp có chương</button>
              )}
              {!isAdmin && (
                <>
                  <button 
                    className="book-btn borrow-book-btn" 
                    disabled={isBlacklisted || book.stock <= 0}
                    onClick={() => setShowBorrowForm(true)}
                  >
                    {isBlacklisted ? "Bị chặn" : "Mượn sách"}
                  </button>
                  <Link to={`/write-review?bookId=${book.id}`} className="book-btn book-btn-secondary">Viết đánh giá</Link>
                </>
              )}
            </div>
          </div>
        </section>

        {showBorrowForm && (
          <div className="borrow-form-overlay">
            <form className="borrow-form-card" onSubmit={submitBorrowOnline}>
              <h3>Mượn sách: {book.title}</h3>
              <div className="form-group">
                <label>Người mượn:</label>
                <input 
                  type="text" 
                  required 
                  value={borrowForm.borrower_name}
                  onChange={(e) => setBorrowForm({...borrowForm, borrower_name: e.target.value})}
                  disabled
                  className="input-disabled"
                />
              </div>
              <div className="form-group">
                <label>Ngày lấy:</label>
                <input 
                  type="date" 
                  min={new Date().toISOString().split("T")[0]}
                  required 
                  value={borrowForm.borrow_date}
                  onChange={(e) => setBorrowForm({...borrowForm, borrow_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Hạn trả:</label>
                <input 
                  type="date" 
                  min={borrowForm.borrow_date}
                  required 
                  onChange={(e) => setBorrowForm({...borrowForm, due_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Tình trạng sách lúc mượn:</label>
                <select 
                  value={borrowForm.condition_borrow} 
                  onChange={(e) => setBorrowForm({...borrowForm, condition_borrow: e.target.value})}
                >
                  <option value="Nguyên vẹn">Nguyên vẹn</option>
                  <option value="Hư hỏng nhẹ">Hư hỏng nhẹ</option>
                </select>
              </div>
              <div className="form-group">
                <label>Link ảnh minh chứng:</label>
                <input 
                  type="text" 
                  placeholder="URL ảnh (nếu có)"
                  value={borrowForm.borrow_image}
                  onChange={(e) => setBorrowForm({...borrowForm, borrow_image: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="book-btn book-btn-primary">Gửi phiếu mượn</button>
                <button type="button" className="book-btn book-btn-secondary" onClick={() => setShowBorrowForm(false)}>Hủy bỏ</button>
              </div>
            </form>
          </div>
        )}

        <section className="book-section-card reveal">
          <div className="book-section-head">
            <p className="book-section-label">Nội dung</p>
            <h2>Danh sách chương ({chapters.length})</h2>
            <div className="book-section-line"></div>
          </div>
          <div className="book-chapter-list">
            {chapters.length > 0 ? (
              chapters.map((ch) => (
                <div key={ch.id} className="book-chapter-item">
                  <div>
                    <p className="book-chapter-number">Chương {ch.order}</p>
                    <h3>{ch.title}</h3>
                  </div>
                  <Link to={`/read/${book.id}/${ch.id}`} className="book-chapter-link">Đọc chương này</Link>
                </div>
              ))
            ) : (
              <p>Sách hiện chưa cập nhật chương nào.</p>
            )}
          </div>
        </section>

        <section className="book-reviews-section">
          <h2>Nhận xét từ độc giả ({reviews.length})</h2>
          <div className="reviews-list">
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <div key={r.id} className="review-item">
                  <div className="review-top-row">
                    <strong className="review-username">{r.user_detail?.username || "Độc giả ẩn danh"}</strong>
                    <div className="review-stars">{renderStars(r.stars)}</div>
                  </div>
                  <span className="review-book-tag">📖 {r.book_title || "Chưa rõ"}</span>
                  {r.review_title && <h4 className="review-title">{r.review_title}</h4>}
                  <p className="review-body">{r.review_body}</p>
                  <span className="review-date">📅 {new Date(r.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
              ))
            ) : (
              <p>Chưa có nhận xét nào cho cuốn sách này.</p>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default BookDetail;