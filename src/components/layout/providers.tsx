"use client";

import { ThemeProvider } from "next-themes";
import { StoreProvider } from "@/store/store-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <StoreProvider>
        <TooltipProvider delay={200}>{children}</TooltipProvider>
        <Toaster richColors position="bottom-right" />
      </StoreProvider>
    </ThemeProvider>
  );
}
