import axios from 'axios';

const API_URL = "http://127.0.0.1:8000/api";

export const getLatestBooks = async () => {
    try {
        // Use the newest books endpoint as provided by the backend
        const response = await axios.get(`${API_URL}/books/newest/`);
        // Nếu Django có phân trang, dùng: return response.data.results;
        // Nếu trả về mảng thẳng như JSON ví dụ thì trả về response.data
        return response.data; 
    } catch (error) {
        console.error("Lỗi lấy danh sách sách:", error);
        return [];
    }
};

export const getPostDetail = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/posts/${id}/`);
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy chi tiết sách:", error);
        throw error;
    }
};

export const getBookDetail = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/books/${id}/`);
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy chi tiết sách (book):", error);
        throw error;
    }
};

export const getBookChapters = async (bookId) => {
    try {
        const response = await axios.get(`${API_URL}/books/${bookId}/chapters/`);
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy chương sách:", error);
        return [];
    }
};

export const getChapter = async (chapterId) => {
    try {
        const response = await axios.get(`${API_URL}/chapters/${chapterId}/`);
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy nội dung chương:", error);
        throw error;
    }
};

export const sendContactMessage = async (data) => {
    const response = await axios.post(`${API_URL}/contact/`, data);
    return response.data;
};