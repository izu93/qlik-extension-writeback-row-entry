import React from "react";
import ReactDOM from "react-dom/client";

// Nebula.js Qlik hooks for extension integration
import {
  useElement,
  useLayout,
  useEffect,
  useApp,
  useModel,
  useSelections,
} from "@nebula.js/stardust";

// Qlik extension configs (property panel, data targets, settings)
import properties from "./object-properties";
import data from "./data";
import ext from "./ext";

// Import the main Smart Writeback component
import SmartWritebackTable from "./components/SmartWritebackTable.jsx";

/**
 * Main supernova export for the Smart Writeback Extension
 * - Handles Qlik engine integration and DOM rendering of React component
 * - Provides app, model, and selections objects for full Qlik functionality
 */
export default function supernova(galaxy) {
  return {
    // Qlik associative engine config: props and data structure
    qae: { properties, data },
    // Nebula settings for property panel and options
    ext: ext(galaxy),
    // Visualization rendering logic
    component() {
      // Reference to Nebula-provided DOM element for rendering
      const element = useElement();
      // Current layout/data object from Qlik app
      const layout = useLayout();
      // Qlik app object for making selections and accessing data model
      const app = useApp();
      // Qlik model object for hypercube operations
      const model = useModel();
      // Qlik selections object for selection management
      const selections = useSelections();

      // Renders the SmartWritebackTable every time dependencies change
      useEffect(() => {
        // Unmount previous React root if it exists (prevents memory leaks)
        if (element.__root) {
          element.__root.unmount();
        }

        // Create and render new React root using SmartWritebackTable with all required objects
        element.__root = ReactDOM.createRoot(element);
        element.__root.render(
          <SmartWritebackTable
            layout={layout}
            app={app}
            model={model}
            selections={selections}
          />
        );

        // Cleanup: unmount on component unmount or re-render
        return () => {
          if (element.__root) {
            element.__root.unmount();
            element.__root = null;
          }
        };
      }, [element, layout, app, model, selections]);
    },
  };
}
