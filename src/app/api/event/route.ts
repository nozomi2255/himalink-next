import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {

    const supabase = await createClient();

    // APIルート内で独自にユーザーIDを取得
    let userId: string;
    try {
        userId = await getUserIdFromRequest();
    } catch (error) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('Entries')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const eventData = await request.json();

    const supabase = await createClient();
    
    // APIルート内で独自にユーザーIDを取得
    let userId: string;
    try {
        userId = await getUserIdFromRequest();
    } catch (error) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const { error } = await supabase
        .from('Entries')
        .insert([{
            ...eventData,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }]);
    
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Event created successfully' }, { status: 201 });
}

export async function PUT(request: Request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const eventData = await request.json();

    const supabase = await createClient();

    if (!eventId) {
        return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('Entries')
        .update({ ...eventData, updated_at: new Date() })
        .eq('id', eventId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Event updated successfully' });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    const supabase = await createClient();

    if (!eventId) {
        return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('Entries')
        .delete()
        .eq('id', eventId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
}

// APIルート専用に、リクエストからユーザーIDを取得する関数
async function getUserIdFromRequest(): Promise<string> {
    const supabase = await createClient();
  
  // Supabaseは通常、認証情報をクッキーに保存しているので、
  // Supabaseクライアントが内部でそのクッキーを自動で利用する場合があります。
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data || !data.user) {
    throw new Error('User not authenticated');
  }
  return data.user.id;
}
