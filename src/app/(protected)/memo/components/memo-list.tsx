import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { MemoCard } from "./memo-card";
import { Memo } from "../../../types";

export function MemoList({ memos }: { memos: Memo[] }) {
  return (
    <Accordion type="multiple">
      {memos.map((memo) => (
        <AccordionItem key={memo.id} value={memo.id}>
          <AccordionTrigger>{memo.title}（投稿者: {memo.user_name}）</AccordionTrigger>
          <AccordionContent>
            <MemoCard memo={memo} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}