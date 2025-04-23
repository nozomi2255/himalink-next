'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  try {
    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      // エラーメッセージを日本語に変換
      let errorMessage = 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'メールアドレスが確認されていません。メールをご確認ください。';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'ログイン試行回数が多すぎます。しばらく時間をおいてお試しください。';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }

    revalidatePath('/', 'layout');
    redirect('/');
  } catch (e: any) {
    // In case of an unexpected error, handle it appropriately
    return { 
      success: false, 
      error: '予期せぬエラーが発生しました。しばらく経ってからもう一度お試しください。'
    };
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  try {
    const { error } = await supabase.auth.signUp(data);

    if (error) {
      // エラーメッセージを日本語に変換
      let errorMessage = 'サインアップに失敗しました。';
      
      if (error.message.includes('already registered')) {
        errorMessage = 'このメールアドレスはすでに登録されています。';
      } else if (error.message.includes('password')) {
        errorMessage = 'パスワードは8文字以上必要です。';
      } else if (error.message.includes('email')) {
        errorMessage = '有効なメールアドレスを入力してください。';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }

    revalidatePath('/', 'layout');
    redirect('/');
  } catch (e: any) {
    return { 
      success: false, 
      error: '予期せぬエラーが発生しました。しばらく経ってからもう一度お試しください。'
    };
  }
}