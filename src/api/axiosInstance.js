import axios from 'axios';

const BASE_URL = 'http://192.168.12.250:8000/api/v1/';

// 1. Özel Axios instance'ı oluşturuyoruz
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
});

// 2. Request (İstek) Interceptor: Atılan HER isteğin header'ına otomatik Access Token ekler
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response (Yanıt) Interceptor: 401 hatası gelirse Refresh Token mekanizmasını çalıştırır
api.interceptors.response.use(
  (response) => response, // İstek başarılıysa aynen devam et
  async (error) => {
    const originalRequest = error.config;

    // Eğer hata 401 (Unauthorized) ise ve bu istek daha önce tekrar denenmediyse
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Sonsuz döngüye girmesin diye işaretliyoruz

      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (!storedRefreshToken) {
          throw new Error('Refresh token bulunamadı');
        }

        // Backend'deki /refresh endpoint'ine istek atıyoruz
        // (Swagger dokümanında gördüğümüz { "refresh_token": "..." } yapısı)
        const refreshResponse = await axios.post(`${BASE_URL}auth/refresh`, {
          refresh_token: storedRefreshToken
        });

        // Yeni gelen token'ları alıp localStorage'ı güncelliyoruz
        const newAccessToken = refreshResponse.data.token || refreshResponse.data.access_token;
        const newRefreshToken = refreshResponse.data.refresh_token;

        localStorage.setItem('token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // O an atılmak istenen orijinal isteğin header'ını yeni token ile güncelle
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Yarıda kalan orijinal isteği TEKRAR AT
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh token da geçersizse veya süresi dolduysa kullanıcıyı oturumdan düşür
        console.error('Oturum yenilenemedi, tekrar giriş yapmalısınız:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;