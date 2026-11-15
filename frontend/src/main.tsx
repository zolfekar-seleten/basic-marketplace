import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { I18nProvider } from "@/i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <HelmetProvider>
            <I18nProvider>
              <TooltipProvider>
                <App />
              </TooltipProvider>
            </I18nProvider>
          </HelmetProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
