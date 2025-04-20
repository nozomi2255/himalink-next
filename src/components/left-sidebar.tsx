"use client";
import React from "react";
import { NavButtons } from "@/components/navi-items";
import { Button } from "@/components/ui/button";

const Sidebar: React.FC = () => (
  <aside className="hidden md:flex flex-col justify-center w-[180px] bg-[#f8faff] p-5 border-r h-screen">
    <NavButtons />

    <div className="w-full mt-auto justify-center">
      <h4 className="mb-2">テンプレート</h4>
      {["ひま", "買い物", "映画"].map((t) => (
        <Button
          key={t}
          variant="secondary"
          className="w-full py-1.5 mb-2 text-[13px] bg-[#e0f7ff] hover:bg-[#d2f0fa]"
        >
          {t}
        </Button>
      ))}
    </div>
  </aside>
);
export default Sidebar;