import React from "react";
import { createRoot } from "react-dom/client";
import TimesheetApp from "./TimesheetApp.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TimesheetApp />
  </React.StrictMode>
);
