"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import AuthModal from "@/components/auth/AuthModal";

interface AuthModalContextType {
  openModal: (mode: "login" | "signup") => void;
  closeModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");

  const openModal = (initialMode: "login" | "signup") => {
    setMode(initialMode);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  return (
    <AuthModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <AuthModal 
        isOpen={isOpen} 
        onClose={closeModal} 
        initialMode={mode} 
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
