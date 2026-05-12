import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getTheme, setTheme } from "../utils/theme";
import { getChapter, getBookChapters } from "../services/bookService";
import { books } from "../data/books";
import "./Reader.css";
const Reader = () => {
  const { bookId, chapterId } = useParams();

  const [darkMode, setDarkModeState] = useState(getTheme());
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("'Crimson Pro', serif");

  const [remoteChapters, setRemoteChapters] = useState(null);
  const [chapterContent, setChapterContent] = useState(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState(null);

  useEffect(() => {
    setTheme(darkMode);
  }, [darkMode]);

  const localBook = useMemo(() => {
    return books.find((item) => item.id === bookId);
  }, [bookId]);

  // prefer chapters from API when available
  const chaptersList = remoteChapters || localBook?.chapters || [];

  const currentChapter = useMemo(() => {
    return chaptersList.find((chapter) => String(chapter.id) === String(chapterId));
  }, [chaptersList, chapterId]);

  useEffect(() => {
    let mounted = true;
    const fetchChapters = async () => {
      setLoadingRemote(true);
      setRemoteError(null);
      try {
        const ch = await getBookChapters(bookId);
        if (!mounted) return;
        setRemoteChapters(ch || []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setRemoteError(err);
      } finally {
        if (mounted) setLoadingRemote(false);
      }
    };

    fetchChapters();
    return () => {
      mounted = false;
    };
  }, [bookId]);

  useEffect(() => {
    let mounted = true;
    const fetchChapterContent = async () => {
      setLoadingRemote(true);
      setRemoteError(null);
      try {
        const data = await getChapter(chapterId);
        if (!mounted) return;
        setChapterContent(data);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setRemoteError(err);
        setChapterContent(null);
      } finally {
        if (mounted) setLoadingRemote(false);
      }
    };

    if (chapterId) fetchChapterContent();

    return () => {
      mounted = false;
    };
  }, [chapterId]);

  if (loadingRemote && !currentChapter) {
    return (
      <div className="reader-page">
        <div className="reader-container">
          <div className="reader-notfound">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <h2 style={{ margin: 0 }}>Đang tải chương…</h2>

              <button
                type="button"
                className="theme-toggle"
                onClick={() => setDarkModeState((prev) => !prev)}
                aria-label="Đổi giao diện sáng tối"
                title={darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              >
                <span className="theme-icon">{darkMode ? "☀️" : "🌙"}</span>
              </button>
            </div>

            <Link to="/">Quay về trang chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentChapter) {
    return (
      <div className="reader-page">
        <div className="reader-container">
          <div className="reader-notfound">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <h2 style={{ margin: 0 }}>Không tìm thấy chương</h2>

              <button
                type="button"
                className="theme-toggle"
                onClick={() => setDarkModeState((prev) => !prev)}
                aria-label="Đổi giao diện sáng tối"
                title={darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              >
                <span className="theme-icon">{darkMode ? "☀️" : "🌙"}</span>
              </button>
            </div>

            <Link to="/">Quay về trang chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = chaptersList.findIndex(
    (chapter) => String(chapter.id) === String(chapterId)
  );

  const prevChapter = currentIndex > 0 ? chaptersList[currentIndex - 1] : null;

  const nextChapter =
    currentIndex < chaptersList.length - 1 ? chaptersList[currentIndex + 1] : null;

  const displayTitle = localBook?.title || chapterContent?.title || "Truyện";

  const contentText = chapterContent?.content || currentChapter.content || "";

  return (
    <div className="reader-page">
      <div className="reader-container">
        <div className="reader-topbar">
          <Link to={`/book/${bookId}`} className="reader-back">
            ← Quay về chi tiết sách
          </Link>

          <div className="reader-controls">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setDarkModeState((prev) => !prev)}
              aria-label="Đổi giao diện sáng tối"
              title={darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
            >
              <span className="theme-icon">{darkMode ? "☀️" : "🌙"}</span>
            </button>

            <button onClick={() => setFontSize((prev) => Math.max(16, prev - 2))}>
              A-
            </button>

            <button onClick={() => setFontSize((prev) => Math.min(30, prev + 2))}>
              A+
            </button>

            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            >
              <option value="'Crimson Pro', serif">Crimson Pro</option>
              <option value="'Georgia', serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Arial', sans-serif">Arial</option>
            </select>
          </div>
        </div>

        <div className="reader-header">
          <p className="reader-kicker">{displayTitle}</p>
          <h1>{currentChapter.title}</h1>
        </div>

        <article
          className="reader-content"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily
          }}
        >
          {contentText.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </article>

        <div className="reader-navigation">
          {prevChapter ? (
            <Link
              to={`/read/${bookId}/${prevChapter.id}`}
              className="reader-nav-btn"
            >
              ← {prevChapter.title}
            </Link>
          ) : (
            <span></span>
          )}

          {nextChapter ? (
            <Link
              to={`/read/${bookId}/${nextChapter.id}`}
              className="reader-nav-btn"
            >
              {nextChapter.title} →
            </Link>
          ) : (
            <span></span>
          )}
        </div>
      </div>
    </div>
  );
};
export default Reader;