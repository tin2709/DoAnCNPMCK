/// <reference types="vite/client" />
/// <reference types="vite/client" />

// THÊM VÀO ĐÂY
declare global {
  interface Window {
    DarkReader: {
      enable: (options?: any) => void;
      disable: () => void;
      isEnabled: () => boolean;
    };
  }
}