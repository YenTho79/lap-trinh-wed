import React, { useEffect, useState, useCallback } from "react";
import { getTheme, setTheme } from "../utils/theme";
import axios from "axios";
import { Link } from "react-router-dom";
import "./BorrowPage.css";
import Footer from "../components/Footer";

export default function BorrowPage() {
  const [borrows, setBorrows] = useState([]);
  const [darkMode, setDarkModeState] = useState(getTheme());
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [allBooks, setAllBooks] = useState([]);
  const [adminForm, setAdminForm] = useState({
    borrower_name: "",
    book_id: "",
    book_name: "",
    borrow_date: new Date().toISOString().split("T")[0],
    due_date: "",
    condition_borrow: "Nguyên vẹn",
    borrow_image: ""
  });

  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedBorrowId, setSelectedBorrowId] = useState(null);
  const [returnForm, setReturnForm] = useState({
    condition_return: "Nguyên vẹn",
    return_image: ""
  });

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const isAdmin = currentUser?.role?.toLowerCase() === "admin" || currentUser?.isAdmin === true;

  const loadBorrows = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/borrows/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBorrows(res.data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách mượn:", err);
    }
  }, [token]);

  useEffect(() => {
    setTheme(darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (token) loadBorrows();
  }, [token, loadBorrows]);

  const openAdminForm = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/books/");
      setAllBooks(res.data);
      setShowAdminForm(true);
    } catch (err) {
      console.error(err);
    }
  };

  const submitAdminBorrow = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/api/borrows/", {
        book: Number(adminForm.book_id),
        borrower_name: adminForm.borrower_name,
        book_name: adminForm.book_name, // Lấy trực tiếp từ state
        borrow_date: adminForm.borrow_date,
        due_date: adminForm.due_date,
        condition_borrow: adminForm.condition_borrow,
        borrow_image: adminForm.borrow_image,
        status: "DangMuon" // Admin tạo là duyệt luôn
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Tạo phiếu thành công!");
      setShowAdminForm(false);
      loadBorrows();
    } catch (err) {
      alert(err.response?.data?.error || "Lỗi tạo phiếu.");
    }
  };

  const handleRequestReturn = (id) => {
    setSelectedBorrowId(id);
    setShowReturnForm(true);
  };

  const submitReturnRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`http://127.0.0.1:8000/api/borrows/${selectedBorrowId}/`, {
        status: "ChoDuyetTra",
        condition_return: returnForm.condition_return,
        return_image: returnForm.return_image
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Đã gửi yêu cầu trả sách!");
      setShowReturnForm(false);
      loadBorrows();
    } catch (err) {
      alert("Gửi yêu cầu thất bại.");
    }
  };

  const updateStatus = async (id, status) => {
    const item = borrows.find(b => b.id === id);
    if (!item) return;

    if (!window.confirm(`Xác nhận chuyển trạng thái sang "${getStatusText(status)}"?`)) return;

    try {
      const payload = { status };
      
      if (status === "DaTra") {
        // Nếu là duyệt trả từ yêu cầu của User, gợi ý sẵn thông tin User đã gửi
        const defaultCond = item.condition_return || "Nguyên vẹn";
        const cond = window.prompt("Tình trạng sách lúc trả:", defaultCond);
        if (cond === null) return;
        
        const defaultImg = item.return_image || "";
        const img = window.prompt("Link ảnh minh chứng trả (nếu có):", defaultImg);
        
        payload.condition_return = cond;
        payload.return_image = img || "";
      } else if (status === "SachMat" || status === "DanhSachDen") {
        const note = window.prompt("Lý do / Ghi chú:", item.admin_note || "Làm mất sách / Quá hạn lâu");
        if (note !== null) payload.admin_note = note;
      }
      
      await axios.patch(`http://127.0.0.1:8000/api/borrows/${id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Cập nhật thành công!");
      loadBorrows();
    } catch (err) {
      alert(err.response?.data?.error || "Cập nhật thất bại.");
    }
  };

  const getStatusText = (status) => {
    const map = {
      ChoDuyet: "Chờ duyệt mượn",
      DangMuon: "Đang mượn",
      DaTra: "Đã trả",
      QuaHan: "Quá hạn",
      TuChoi: "Từ chối",
      SachMat: "Sách mất",
      DanhSachDen: "Danh sách đen",
      ChoDuyetTra: "Chờ duyệt trả",
    };
    return map[status] || status;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    if (date === "Quỵt") return <b style={{ color: "#ff4d4f" }}>Quỵt</b>;
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const filteredBorrows = activeFilter === "all" 
    ? borrows 
    : borrows.filter(b => {
        const status = b.status || "ChoDuyet";
        return activeFilter === "blacklist" 
          ? (status === "SachMat" || status === "DanhSachDen") 
          : status === activeFilter;
      });

  if (!token) return <div className="borrow-page">Vui lòng đăng nhập...</div>;

  return (
    <>
      <div className={`borrow-page ${darkMode ? "dark-mode" : ""}`}>
        <header className="borrow-header reveal">
          <div>
            <p className="borrow-label">Thư viện Góc Sách</p>
            <h1 className="gs-gold-text">{isAdmin ? "Quản lý Mượn / Trả sách" : "Lịch sử mượn sách của bạn"}</h1>
          </div>
          <div className="borrow-header-actions">
            {isAdmin && (
              <button className="book-btn book-btn-primary" onClick={openAdminForm} style={{marginRight: '15px'}}>+ Tạo phiếu tại quầy</button>
            )}
            <Link to="/" className="borrow-home-link">← Trang chủ</Link>
            <button className="theme-toggle" onClick={() => setDarkModeState(!darkMode)}>
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <section className="borrow-stats reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          <div className={`borrow-stat-card ${activeFilter === "all" ? "active" : ""}`} onClick={() => setActiveFilter("all")}>
            <span>Tổng phiếu</span><strong>{borrows.length}</strong>
          </div>
          <div className={`borrow-stat-card ${activeFilter === "ChoDuyet" ? "active" : ""}`} onClick={() => setActiveFilter("ChoDuyet")}>
            <span>Chờ duyệt</span><strong>{borrows.filter(b => (b.status || "ChoDuyet") === "ChoDuyet").length}</strong>
          </div>
          <div className={`borrow-stat-card ${activeFilter === "DangMuon" ? "active" : ""}`} onClick={() => setActiveFilter("DangMuon")}>
            <span style={{color: '#1890ff'}}>Đang mượn</span><strong>{borrows.filter(b => b.status === "DangMuon").length}</strong>
          </div>
          <div className={`borrow-stat-card ${activeFilter === "QuaHan" ? "active" : ""}`} onClick={() => setActiveFilter("QuaHan")}>
            <span style={{color: '#faad14'}}>Quá hạn</span><strong>{borrows.filter(b => b.status === "QuaHan").length}</strong>
          </div>
          <div className={`borrow-stat-card ${activeFilter === "DaTra" ? "active" : ""}`} onClick={() => setActiveFilter("DaTra")}>
            <span style={{color: '#52c41a'}}>Đã trả</span><strong>{borrows.filter(b => b.status === "DaTra").length}</strong>
          </div>
          <div className={`borrow-stat-card ${activeFilter === "TuChoi" ? "active" : ""}`} onClick={() => setActiveFilter("TuChoi")}>
            <span style={{color: '#8c8c8c'}}>Từ chối</span><strong>{borrows.filter(b => b.status === "TuChoi").length}</strong>
          </div>
          <div className={`borrow-stat-card ${activeFilter === "ChoDuyetTra" ? "active" : ""}`} onClick={() => setActiveFilter("ChoDuyetTra")}>
            <span style={{color: '#fa8c16'}}>Chờ trả</span><strong>{borrows.filter(b => b.status === "ChoDuyetTra").length}</strong>
          </div>
          <div className={`borrow-stat-card ${activeFilter === "blacklist" ? "active" : ""}`} onClick={() => setActiveFilter("blacklist")}>
            <span style={{color: 'red'}}>DS Đen / Mất</span><strong>{borrows.filter(b => b.status === "SachMat" || b.status === "DanhSachDen").length}</strong>
          </div>
        </section>

        <section className="borrow-table-card reveal">
          <div className="borrow-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  {isAdmin && <th>Người mượn</th>}
                  <th>Sách</th>
                  <th>Hạn trả</th>
                  <th>Ngày trả</th>
                  <th>Tình trạng</th>
                  <th>Minh chứng</th>
                  <th>Ghi chú</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBorrows.map((item) => {
                  const finalStatus = item.status || "ChoDuyet";
                  const borrower = item.borrower_name || item.user_name || item.user_email || `User ${item.user}`;
                  const book = item.book_name || (item.details && item.details.length > 0 ? item.details[0].book_title : "Sách");
                  
                  return (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    {isAdmin && <td>{borrower}</td>}
                    <td>{book}</td>
                    <td>{formatDate(item.due_date)}</td>
                    <td>{finalStatus === "SachMat" || finalStatus === "DanhSachDen" ? <b style={{ color: "#ff4d4f" }}>Quỵt</b> : formatDate(item.return_date)}</td>
                    <td>
                      <div style={{fontSize: '0.85em'}}>
                        <div><b>Mượn:</b> {item.condition_borrow || "-"}</div>
                        {item.condition_return && <div><b>Trả:</b> {item.condition_return}</div>}
                      </div>
                    </td>
                    <td>
                      <div style={{fontSize: '0.85em'}}>
                        {item.borrow_image && <div><a href={item.borrow_image} target="_blank" rel="noreferrer">📷 Ảnh mượn</a></div>}
                        {item.return_image && <div><a href={item.return_image} target="_blank" rel="noreferrer">📷 Ảnh trả</a></div>}
                        {!item.borrow_image && !item.return_image && "-"}
                      </div>
                    </td>
                    <td style={{fontSize: '0.85em', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={item.admin_note || item.note}>
                      {item.admin_note || item.note || "-"}
                    </td>
                    <td>
                      <span className={`borrow-status status-${finalStatus}`}>
                        {getStatusText(finalStatus)}
                      </span>
                    </td>
                    {isAdmin ? (
                      <td>
                        <div className="borrow-actions">
                          {finalStatus === "ChoDuyet" && (
                            <>
                              <button onClick={() => updateStatus(item.id, "DangMuon")}>Duyệt mượn</button>
                              <button className="danger" onClick={() => updateStatus(item.id, "TuChoi")}>Từ chối</button>
                            </>
                          )}
                          {finalStatus === "ChoDuyetTra" && (
                            <button onClick={() => updateStatus(item.id, "DaTra")}>Duyệt trả</button>
                          )}
                          {(finalStatus === "DangMuon" || finalStatus === "QuaHan") && (
                            <>
                              <button onClick={() => updateStatus(item.id, "DaTra")}>Trả nhanh</button>
                              <button className="danger" onClick={() => updateStatus(item.id, "SachMat")}>Mất sách</button>
                            </>
                          )}
                        </div>
                      </td>
                    ) : (
                      <td>
                        {(finalStatus === "DangMuon" || finalStatus === "QuaHan") && (
                          <button 
                            className="book-btn book-btn-primary" 
                            style={{padding: '5px 10px', fontSize: '0.8rem'}}
                            onClick={() => handleRequestReturn(item.id)}
                          >
                            Yêu cầu trả
                          </button>
                        )}
                        {finalStatus === "ChoDuyetTra" && <span style={{fontSize: '0.8rem', opacity: 0.7}}>Đang chờ duyệt...</span>}
                      </td>
                    )}
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </section>

        {showAdminForm && (
          <div className="borrow-form-overlay">
            <form className="borrow-form-card" onSubmit={submitAdminBorrow} style={{maxHeight: '90vh', overflowY: 'auto'}}>
              <h3>Tạo phiếu mượn (Tại quầy)</h3>
              <div className="form-group">
                <label>Người mượn:</label>
                <input 
                  type="text" required
                  value={adminForm.borrower_name}
                  onChange={(e) => setAdminForm({...adminForm, borrower_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Sách:</label>
                <select 
                  required 
                  value={adminForm.book_id}
                  onChange={(e) => {
                    const bid = e.target.value;
                    const bObj = allBooks.find(x => String(x.id) === String(bid));
                    setAdminForm({
                      ...adminForm, 
                      book_id: bid,
                      book_name: bObj ? bObj.title : ""
                    });
                  }}
                >
                  <option value="">-- Chọn sách --</option>
                  {allBooks.map(b => (
                    <option key={b.id} value={b.id}>{b.title} (Kho: {b.stock})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Ngày lấy (mặc định hôm nay):</label>
                <input 
                  type="date" required
                  value={adminForm.borrow_date}
                  onChange={(e) => setAdminForm({...adminForm, borrow_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Hạn trả:</label>
                <input 
                  type="date" required min={adminForm.borrow_date}
                  value={adminForm.due_date}
                  onChange={(e) => setAdminForm({...adminForm, due_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Tình trạng sách lúc giao:</label>
                <select value={adminForm.condition_borrow} onChange={(e) => setAdminForm({...adminForm, condition_borrow: e.target.value})}>
                  <option value="Nguyên vẹn">Nguyên vẹn</option>
                  <option value="Hư hỏng nhẹ">Hư hỏng nhẹ</option>
                </select>
              </div>
              <div className="form-group">
                <label>Link ảnh minh chứng (nếu có):</label>
                <input 
                  type="text" 
                  value={adminForm.borrow_image}
                  onChange={(e) => setAdminForm({...adminForm, borrow_image: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="book-btn book-btn-primary">Tạo phiếu</button>
                <button type="button" className="book-btn book-btn-secondary" onClick={() => setShowAdminForm(false)}>Hủy bỏ</button>
              </div>
            </form>
          </div>
        )}
        {showReturnForm && (
          <div className="borrow-form-overlay">
            <form className="borrow-form-card" onSubmit={submitReturnRequest}>
              <h3>Yêu cầu trả sách</h3>
              <p style={{textAlign: 'center', marginBottom: '20px', opacity: 0.8}}>Vui lòng xác nhận tình trạng sách trước khi gửi cho Admin.</p>
              
              <div className="form-group">
                <label>Tình trạng sách thực tế:</label>
                <select 
                  value={returnForm.condition_return}
                  onChange={(e) => setReturnForm({...returnForm, condition_return: e.target.value})}
                >
                  <option value="Nguyên vẹn">Nguyên vẹn</option>
                  <option value="Hư hỏng nhẹ">Hư hỏng nhẹ</option>
                  <option value="Hư hỏng nặng">Hư hỏng nặng</option>
                  <option value="Làm mất">Làm mất</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ảnh minh chứng (nếu có):</label>
                <input 
                  type="text" 
                  placeholder="URL ảnh thực tế"
                  value={returnForm.return_image}
                  onChange={(e) => setReturnForm({...returnForm, return_image: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="book-btn book-btn-primary">Gửi yêu cầu</button>
                <button type="button" className="book-btn book-btn-secondary" onClick={() => setShowReturnForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}