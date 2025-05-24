"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Dialog({ open, onClose, children, title }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-dark-100/90 flex items-center justify-center p-4">
      <div className="bg-dark-200 rounded-lg shadow-xl w-full max-w-7xl border border-dark-300 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-3 border-b border-dark-300 shrink-0">
          {title && <h2 className="text-xl font-semibold text-light-100">{title}</h2>}
          <button onClick={onClose} className="text-light-100/70 hover:text-light-100">
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
