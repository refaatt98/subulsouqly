import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { trackViewport } from "./lib/viewport";

trackViewport();

createRoot(document.getElementById("root")!).render(<App />);
