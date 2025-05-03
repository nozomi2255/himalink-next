export default function SignupConfirmPage() {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">確認メールを送信しました</h1>
        <p className="text-gray-700">
          入力されたメールアドレスに確認用リンクをお送りしました。<br />
          メールを確認してアカウントの有効化を完了してください。
        </p>
      </div>
    );
  }