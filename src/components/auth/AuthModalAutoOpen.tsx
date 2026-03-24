"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthModal } from "@/context/AuthModalContext";

export default function AuthModalAutoOpen() {
  const searchParams = useSearchParams();
  const { openModal } = useAuthModal();

  useEffect(() => {
    const authMode = searchParams.get("auth");

    if (authMode === "login") {
      openModal("login");
      return;
    }

    if (authMode === "signup" || authMode === "register") {
      openModal("signup");
    }
  }, [searchParams, openModal]);

  return null;
}
