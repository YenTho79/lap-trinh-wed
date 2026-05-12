import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLatestBooks } from '../services/bookService';

const LatestBooks = () => {
  const [apiBooks, setApiBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await getLatestBooks();
        setApiBooks(data);
      } catch (error) {
        console.error("Lỗi lấy sách mới nhất:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Styles từ bản gốc của bạn
  const sectionHeaderStyle = { textAlign: "center", marginBottom: "3rem" };
  const sectionLabelStyle = { color: "var(--gold)", letterSpacing: "2px", textTransform: "uppercase", fontSize: "0.9rem" };
  const sectionTitleStyle = { fontFamily: "Playfair Display", fontSize: "2.5rem", marginTop: "0.5rem" };

  return (
    <section className="books-section" id="sach">
      <div style={sectionHeaderStyle}>
        <p style={sectionLabelStyle}>Thư viện</p>
        <h2 style={sectionTitleStyle}>Sách mới nhất</h2>
        <div className="deco-line"></div>
      </div>

      <div className="books-grid">
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--gold)", gridColumn: "1/-1" }}>
            Đang mở kho sách...
          </p>
        ) : (
          apiBooks.map((book) => (
            <div className="book-card fade-in" key={book.post_id}>
              <Link to={`/book/${book.post_id}`} className="book-link">
                <div className="book-cover">
                  <img
                    src={book.image || `/images/covers/default.jpg`} 
                    alt={book.title}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                  <div className="cover-overlay">
                    <span>Xem chi tiết</span>
                  </div>
                </div>
              </Link>
              <div className="book-info-wrapper" style={{ padding: "15px", textAlign: "center" }}>
                <h4 className="book-title">{book.title}</h4>
                <p style={{ color: "var(--gold)", fontSize: "0.9rem" }}>
                  {"⭐".repeat(5)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default LatestBooks;