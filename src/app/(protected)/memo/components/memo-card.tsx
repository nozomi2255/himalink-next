import { Memo } from "../../../types";

export function MemoCard({ memo }: { memo: Memo }) {
  return (
    <div className="prose">
      <p className="text-sm text-muted-foreground">
        更新日時: {new Date(memo.updated_at).toLocaleString()} | 投稿者: {memo.user_name}
      </p>
      <div dangerouslySetInnerHTML={{ __html: memo.body }} />
    </div>
  );
}