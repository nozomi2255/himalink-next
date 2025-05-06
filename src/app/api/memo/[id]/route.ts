import { createClient } from "@/utils/supabase/client"; // supabase client のパスは環境に合わせてください
import { NextResponse } from "next/server";

// PUT: メモを更新
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { title, body } = await req.json(); // 更新する可能性のあるフィールド
  const supabase = createClient();

  // update_memo RPC関数を呼び出す
  // _pinned の更新も必要であれば、リクエストボディから受け取るように変更してください
  const { data, error } = await supabase.rpc('update_memo', {
    _id: id,
    _title: title, // title が undefined でも渡す（NULLになる想定）
    _body: body,   // body が undefined でも渡す（NULLになる想定）
    // _pinned: pinned // 必要であれば pinned も更新対象にする
  });

  if (error) {
    console.error("Update Memo Error:", error);
    return NextResponse.json({ error: "メモの更新に失敗しました: " + error.message }, { status: 500 });
  }

  // SupabaseのRPC関数が更新後のデータを返すことを期待
  // もし返さない場合は、更新成功を示すレスポンスを返す
  // RPC関数の実装によっては data が配列で返る場合があるので data[0] をチェック
  if (data && Array.isArray(data) && data.length > 0) {
     return NextResponse.json(data[0]);
  } else if (data) {
     // data が配列でない場合 (単一オブジェクトなど)
     return NextResponse.json(data)
  } else {
     // 更新成功したがデータが返らない場合のレスポンス (データを再取得)
     const { data: updatedMemo, error: fetchError } = await supabase
       .from('memos') // テーブル名を指定 (実際のテーブル名に合わせてください)
       .select('*')
       .eq('id', id)
       .single();
     if (fetchError || !updatedMemo) {
        console.error("Fetch after update error:", fetchError)
        // 再取得に失敗しても更新自体は成功している可能性があるため、メッセージと共に200を返すことも検討
        return NextResponse.json({ message: "更新成功 (データ再取得失敗)", error: fetchError?.message }, { status: 500 });
     }
     return NextResponse.json(updatedMemo);
  }
}

// DELETE: メモを削除
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createClient();

  // delete_memo RPC関数を呼び出す
  const { error } = await supabase.rpc('delete_memo', {
    _memo_id: id
  });

  if (error) {
    console.error("Delete Memo Error:", error);
    return NextResponse.json({ error: "メモの削除に失敗しました: " + error.message }, { status: 500 });
  }

  // 削除成功
  return NextResponse.json({ message: "メモを削除しました" }, { status: 200 });
} 