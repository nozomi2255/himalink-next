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
      // If the error message indicates a missing auth session, redirect to the login page
      if (error.message.includes('Auth session missing')) {
        redirect('/login');
      } else {
        redirect('/error');
      }
    }
  } catch (e: any) {
    // In case of an unexpected error, handle it appropriately
    if (e instanceof Error && e.message.includes('Auth session missing')) {
      redirect('/login');
    } else {
      redirect('/error');
    }
  }

  revalidatePath('/', 'layout');
  redirect('/');
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
      if (error.message.includes('Auth session missing')) {
        redirect('/login');
      } else {
        redirect('/error');
      }

    }
  } catch (e: any) {
    if (e instanceof Error && e.message.includes('Auth session missing')) {
      redirect('/login');
    } else {
      redirect('/error');
    }
  }

  revalidatePath('/', 'layout');
  redirect('/');
}