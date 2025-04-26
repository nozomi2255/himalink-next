"use client";

import React, { useState } from "react";
import { signup } from "./actions"; // サインアップ処理をインポート
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // アイコンをインポート
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, LogIn, Loader2 } from "lucide-react";

// onClose プロパティの型を定義
interface SignupModalProps {
  onClose: () => void; // 閉じるための関数
}

export default function SignupModal({ onClose }: SignupModalProps) {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setStep("password");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      await signup(formData); // サインアップ処理を呼び出す
    } catch (error) {
      console.error("サインアップエラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const slideAnimation = {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: { duration: 0.2 }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">ひまリンクにサインアップ</DialogTitle>
          <DialogDescription>
            アカウントを作成して、ひまリンクを始めましょう
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
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
                <motion.form
                  key="email"
                  onSubmit={handleEmailSubmit}
                  {...slideAnimation}
                >
                  <div className="relative">
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
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="password"
                  onSubmit={handleSignup}
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
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 