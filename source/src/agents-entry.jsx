import React from "react";
import { createRoot } from "react-dom/client";
import { installHover } from "./hover.js";
installHover();
import { AgentsWorkspace } from "./agents-concept.jsx";
createRoot(document.getElementById("root")).render(<AgentsWorkspace />);
