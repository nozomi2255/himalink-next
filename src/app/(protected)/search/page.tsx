"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type User = {
  id: string;
  name: string;
  email: string;
  is_following?: boolean;
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('search_users', {
          search_query: searchQuery.toLowerCase()
        });

      if (error) throw error;

      // フォロー状態を確認
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user?.id) throw new Error("ユーザーが見つかりません");

      const { data: followingIdsData, error: followError } = await supabase
        .rpc('get_following_ids', { follower_id: currentUser.user.id });

      if (followError) throw followError;

      const followingIds = new Set(
        (followingIdsData ?? []).map((row: { following_id: string }) => row.following_id)
      );

      setSearchResults(data.map((user: User) => ({
        ...user,
        is_following: followingIds.has(user.id),
      })));
    } catch (error) {
      console.error("検索中にエラーが発生しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user?.id) throw new Error("ログインが必要です");

      const { error } = await supabase
        .rpc('toggle_follow', {
          p_follower_id: currentUser.user.id,
          p_following_id: userId,
        });

      if (error) throw error;

      // 検索結果の状態を更新
      setSearchResults(prev => prev.map(user => {
        if (user.id === userId) {
          return { ...user, is_following: !user.is_following };
        }
        return user;
      }));
    } catch (error) {
      console.error("フォロー処理中にエラーが発生しました:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="ユーザーを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          <Search className="size-4 mr-2" />
          {isLoading ? "検索中..." : "検索"}
        </Button>
      </div>

      <div className="space-y-4">
        {searchResults.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <Button
              variant={user.is_following ? "default" : "outline"}
              onClick={() => handleFollow(user.id)}
            >
              {user.is_following ? "フォロー中" : "フォロー"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}