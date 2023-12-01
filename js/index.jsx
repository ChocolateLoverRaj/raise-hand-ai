import React from "react";
import { createRoot } from "react-dom/client";
import { WasmReact, App } from "../pkg/index"
import '@tensorflow/tfjs-backend-webgl'

WasmReact.useReact(React); // Tell wasm-react to use your React runtime

const root = createRoot(document.getElementById("root"));
root.render(<App />);
