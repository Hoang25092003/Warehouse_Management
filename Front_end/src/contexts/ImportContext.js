// ImportContext.js
import { createContext, useState } from "react";

export const ImportContext = createContext();

export const ImportProvider = ({ children }) => {
  const [importedData, setImportedData] = useState(null);

  return (
    <ImportContext.Provider value={{ importedData, setImportedData }}>
      {children}
    </ImportContext.Provider>
  );
};
