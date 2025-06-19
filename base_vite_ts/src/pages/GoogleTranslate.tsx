import React, { useEffect } from 'react';

// Khai báo để TypeScript không báo lỗi với đối tượng 'google' trên window
declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

const GoogleTranslate: React.FC = () => {
  useEffect(() => {
    // Định nghĩa hàm callback mà Google Script sẽ gọi sau khi tải xong
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          // Ngôn ngữ gốc của trang web
          pageLanguage: 'vi',
          // Các ngôn ngữ bạn muốn dịch sang: Anh, Nhật, Việt
          includedLanguages: 'en,ja,vi',
          // Giao diện đơn giản (chỉ có dropdown)
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        'google_translate_element' // ID của div sẽ chứa widget
      );
    };

    // Kiểm tra xem script đã tồn tại chưa để tránh thêm nhiều lần
    if (!document.querySelector('#google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = `//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy một lần

  return (
    // Div này sẽ là nơi Google Dịch hiển thị nút/dropdown chọn ngôn ngữ.
    // Chúng ta sẽ định vị nó ở góc trên bên phải của trang.
    <div
      id="google_translate_element"
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000, // Đảm bảo nó nổi lên trên các thành phần khác
      }}
    ></div>
  );
};

export default GoogleTranslate;