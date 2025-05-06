import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MemoCard } from "./memo-card";
import { Memo } from "../../../types";
import { Pencil, Trash2 } from "lucide-react";

interface MemoListProps {
  memos: Memo[];
  onEdit: (memo: Memo) => void;
  onDelete: (memoId: string) => void;
}

export function MemoList({ memos, onEdit, onDelete }: MemoListProps) {
  return (
    <Accordion type="multiple">
      {memos.map((memo) => (
        <AccordionItem key={memo.id} value={memo.id}>
          <div className="flex items-center justify-between pr-4">
            <AccordionTrigger className="flex-grow">{memo.title}（投稿者: {memo.user_name}）</AccordionTrigger>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(memo); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(memo.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <AccordionContent>
            <MemoCard memo={memo} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}