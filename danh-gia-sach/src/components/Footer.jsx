import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaYoutube, FaInstagram, FaTwitter } from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer-luxury">
      <div className="footer-container stagger-container">
        {/* Cột 1: Thương hiệu & Giới thiệu */}
        <div className="footer-section brand-section reveal reveal-left">
          <img src="/images/logo.png" alt="Góc Sách Logo" className="footer-logo" />
          <p className="footer-tagline">
            Lan tỏa tri thức và giá trị văn chương qua từng trang sách.
            Nơi kết nối những tâm hồn yêu sách và khao khát khám phá thế giới.
          </p>
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noreferrer"><FaFacebookF /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer"><FaYoutube /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer"><FaInstagram /></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer"><FaTwitter /></a>
          </div>
        </div>

        {/* Cột 2: Danh mục & Liên kết nhanh */}
        <div className="footer-section links-section reveal reveal-up">
          <h3 className="footer-heading">Khám Phá</h3>

          <ul className="footer-list">
            <li>
              <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                Trang Chủ
              </Link>
            </li>

            <li>
              <Link
                to="/#sach"
                onClick={() => {
                  setTimeout(() => {
                    const section = document.getElementById("sach");
                    section?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              >
                Kho Sách
              </Link>
            </li>

            <li>
              <Link
                to="/borrows"
                onClick={() => window.scrollTo(0, 0)}
              >
                Mượn Sách
              </Link>
            </li>

            <li><Link to="/">Hội Viên</Link></li>
            <li><Link to="/">Tin Tức</Link></li>
          </ul>
        </div>

        {/* Cột 3: Chính sách */}
        <div className="footer-section links-section reveal reveal-up">
          <h3 className="footer-heading">Hỗ Trợ</h3>
          <ul className="footer-list">
            <li><Link to="/">Hướng Dẫn Mượn</Link></li>
            <li><Link to="/">Chính Sách Bảo Mật</Link></li>
            <li><Link to="/">Điều Khoản Sử Dụng</Link></li>
            <li><Link to="/">Câu Hỏi Thường Gặp</Link></li>
            <li><Link to="/">Liên Hệ</Link></li>
          </ul>
        </div>


        {/* Cột 4: Giờ làm việc & Newsletter */}
        <div className="footer-section work-section reveal reveal-right">
          <h3 className="footer-heading">Giờ Hoạt Động</h3>
          <div className="work-item">
            <p><strong>Thứ 2 - Thứ 6:</strong> 08:00 - 21:00</p>
            <p><strong>Thứ 7 - CN:</strong> 09:00 - 18:00</p>
          </div>
        </div>
      </div >

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>© {new Date().getFullYear()} Bản quyền thuộc về <strong>Nhóm 3 - Góc Sách Luxury</strong></p>
          <div className="footer-bottom-links">
            <span>Thiết kế bởi Yến Thơ</span>
          </div>
        </div>
      </div>
    </footer >
  );
};

export default Footer;
