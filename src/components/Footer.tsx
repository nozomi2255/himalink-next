"use client";
import React from "react";
import { NavButtons } from "@/components/navi-items";

const Footer: React.FC = () => (
  <footer className="fixed bottom-0 left-0 right-0 flex md:hidden bg-white border-t p-2 z-10">
    <NavButtons />
  </footer>
);
export default Footer;