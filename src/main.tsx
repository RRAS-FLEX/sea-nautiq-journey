import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initializeGTM } from "@/lib/gtm";
import "./index.css";

initializeGTM(import.meta.env.VITE_GTM_ID);

createRoot(document.getElementById("root")!).render(<App />);
