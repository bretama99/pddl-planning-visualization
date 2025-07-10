import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set document title
document.title = "Dynamic PDDL Plan Visualizer";

createRoot(document.getElementById("root")!).render(<App />);
