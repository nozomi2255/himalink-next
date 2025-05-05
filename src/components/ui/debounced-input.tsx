import React, { useState, useEffect, ChangeEvent, useCallback, useRef } from "react";
import { Input } from "./input";

interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  type?: string;
  debounceTime?: number;
}

const DebouncedInputComponent = ({
  value: externalValue,
  onChange,
  placeholder,
  className,
  autoFocus = false,
  type = "text",
  debounceTime = 100, // デフォルトの遅延時間
}: DebouncedInputProps) => {
  // 内部状態で値を管理
  const [internalValue, setInternalValue] = useState(externalValue);
  
  // タイマーIDを保持するためのref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isTyping = useRef(false); // 入力中かどうかを追跡するフラグ

  // 外部の値が変更された場合、入力中でなければ内部状態を更新
  useEffect(() => {
    if (!isTyping.current) {
      setInternalValue(externalValue);
    }
  }, [externalValue]);

  // コンポーネントのアンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 内部状態はすぐに更新（ユーザー入力をリアルタイムに反映）
    setInternalValue(newValue);
    isTyping.current = true; // 入力開始をマーク
    
    // 以前のタイマーをクリア
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // 指定時間後に親コンポーネントへ通知（再レンダリングを減らす）
    timerRef.current = setTimeout(() => {
      isTyping.current = false; // 入力完了をマーク
      onChange(newValue);
    }, debounceTime);
  }, [onChange, debounceTime]);

  return (
    <Input
      type={type}
      value={internalValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      autoFocus={autoFocus}
    />
  );
};

// React.memoでラップしてパフォーマンスを最適化
export const DebouncedInput = React.memo(DebouncedInputComponent); 