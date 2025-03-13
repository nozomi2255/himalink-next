/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",   // 使用技術に応じてパスを指定（App Routerの場合）
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}", // Pagesルーターを使う場合
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
      extend: {
        colors: {
          // ここにカスタムカラーを定義
        },
        opacity: {
            '90': '0.9',
          // 必要に応じてカスタム不透明度値を定義
        },
        // 他のカスタム設定...
      }
    },
    plugins: [],
  };