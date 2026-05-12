import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WriteReview from "./pages/WriteReview";
import BookDetail from "./pages/BookDetail";
import Reader from "./pages/Reader";
import AdminDashboard from "./pages/AdminDashboard";
import BorrowPage from "./pages/BorrowPage";

const LuxuryCursor = () => {
  useEffect(() => {
    const cursor = document.getElementById("luxury-cursor");
    const follower = document.getElementById("luxury-cursor-follower");
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const render = () => {
      // Smooth interpolation for inertia
      cursorX += (mouseX - cursorX) * 1;
      cursorY += (mouseY - cursorY) * 1;
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;

      if (cursor) cursor.style.transform = `translate3d(${cursorX - 5}px, ${cursorY - 5}px, 0)`;
      if (follower) follower.style.transform = `translate3d(${followerX - 17.5}px, ${followerY - 17.5}px, 0)`;

      requestAnimationFrame(render);
    };

    const handleHover = () => {
      if (follower) {
        follower.style.width = "70px";
        follower.style.height = "70px";
        follower.style.transform = `translate3d(${followerX - 35}px, ${followerY - 35}px, 0)`;
        follower.style.background = "rgba(184, 149, 110, 0.1)";
      }
    };

    const handleLeave = () => {
      if (follower) {
        follower.style.width = "35px";
        follower.style.height = "35px";
        follower.style.background = "transparent";
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    render();

    // Attach to all interactive elements
    const attachEvents = () => {
      const interactive = document.querySelectorAll("a, button, .book-card, .admin-menu-item, input, select");
      interactive.forEach(el => {
        el.addEventListener("mouseenter", handleHover);
        el.addEventListener("mouseleave", handleLeave);
      });
    };

    attachEvents();
    const mo = new MutationObserver(attachEvents);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      mo.disconnect();
    };
  }, []);

  return (
    <>
      <div id="luxury-cursor"></div>
      <div id="luxury-cursor-follower"></div>
    </>
  );
};

const ScrollReveal = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reveal logic
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    const scan = () => {
      document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
    };

    // Parallax logic for images
    const handleParallax = () => {
      document.querySelectorAll(".book-cover img").forEach(img => {
        const speed = 0.05;
        const rect = img.getBoundingClientRect();
        const vh = window.innerHeight;
        if (rect.top < vh && rect.bottom > 0) {
          const y = (rect.top - vh / 2) * speed;
          img.style.transform = `scale(1.1) translateY(${y}px)`;
        }
      });
    };

    scan();
    window.addEventListener("scroll", handleParallax);
    const mutationObserver = new MutationObserver(scan);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", handleParallax);
    };
  }, [pathname]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <LuxuryCursor />
      <ScrollReveal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/write-review" element={<WriteReview />} />
        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/read/:bookId/:chapterId" element={<Reader />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/borrows" element={<BorrowPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;