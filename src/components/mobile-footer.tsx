"use client";
import React from "react";
import { NavButtons } from "@/components/navi-items";

const MobileFooter: React.FC = () => (
  <footer className="fixed bottom-0 w-full flex md:hidden bg-white justify-center border-t p-2 z-20">
    <NavButtons />
  </footer>
);
export default MobileFooter;