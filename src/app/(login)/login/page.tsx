'use client';

import { useState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import SignupModal from "./signup-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/24/outline";
import { ArrowRight, LogIn, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Page() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setStep("password");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      await login(formData);
    } catch (error) {
      console.error("ログインエラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const slideAnimation = {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: { duration: 0.2 }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justyfy-center md:justify-center min-h-screen px-3 py-5 md:py-0">
      {/* ロゴ */}
      <div className="w-full md:w-auto md:flex-shrink-0 mb-5 mt-0 md:mb-0">
        <Image
          src="/logo/logo.png"
          alt="Himalink Logo"
          width={400}
          height={400}
          className="w-[150px] h-[150px] md:w-full md:h-full max-w-[400px] md:max-w-[800px] mx-auto drop-shadow-lg transform hover:-translate-y-1 transition-transform duration-300"
        />
      </div>
      {/* テキストとログインフォーム */}
      <div className="flex flex-col items-center md:ml-5 text-center md:text-left">
        {/* キャッチコピー */}
        <h1 className="text-xl font-bold md:mb-3">
          あなたの誘いを待つ友達がいます。
        </h1>
        {/* ログインフォーム */}
        <Card className="w-full max-w-md mt-8 pt-3 gap-2 border-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium">今すぐログイン</CardTitle>
            <CardDescription>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={step === "email" ? handleEmailSubmit : handleLogin} className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between h-6">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">メールアドレス</label>
                    <span className="text-sm min-w-[120px]">{step === "password" && email}</span>
                  </div>
                  <div className="w-12">
                    {step === "password" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep("email")}
                        className="text-xs text-blue-600 hover:text-blue-800 h-6"
                      >
                        変更
                      </Button>
                    )}
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {step === "email" ? (
                    <motion.div
                      key="email"
                      {...slideAnimation}
                      className="relative"
                    >
                      <input
                        type="email"
                        placeholder="メールアドレス"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md pr-16"
                        required
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <Button
                          type="submit"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="password"
                      {...slideAnimation}
                    >
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="パスワード"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md pr-24"
                          required
                          disabled={isLoading}
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowPassword(!showPassword)}
                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                            disabled={isLoading}
                          >
                            {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                          </Button>
                          <Button
                            type="submit"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <LogIn className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <button
              className="text-xs text-blue-600 hover:text-blue-800"
              disabled={isLoading}
            >
              パスワードを忘れた場合はこちら
            </button>
          </CardFooter>
        </Card>
        {/* アカウントを作成リンク */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setIsSignupOpen(true)}
          className="mt-3 lg:mt-4 text-blue-500 text-sm md:text-base font-semibold hover:underline"
        >
          アカウントを作成
        </Button>
      </div>
      {isSignupOpen && <SignupModal onClose={() => setIsSignupOpen(false)} />}
    </div>
  );
}