import { createClient } from "@/utils/supabase/client";
import { NextResponse } from "next/server";

// GET: メモ一覧を取得
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_memos');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: 新規メモを作成
export async function POST(req: Request) {
  const { title, body, user_id, user_name } = await req.json();
  const supabase = createClient();

  const { data, error } = await supabase.rpc('create_memo', {
    p_user_id: user_id,
    p_user_name: user_name,
    p_title: title,
    p_body: body,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}