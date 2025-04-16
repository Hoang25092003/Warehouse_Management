import React, { createContext, useState, useEffect } from "react";

export const ImportContext = createContext();

export const ImportProvider = ({ children }) => {
  const [importData, setImportData] = useState([]);

  // Load từ localStorage khi khởi động
  useEffect(() => {
    const saved = localStorage.getItem("warehouse_import_data");
    if (saved) {
      setImportData(JSON.parse(saved));
    }
  }, []);

  // Lưu vào localStorage mỗi lần thay đổi
  useEffect(() => {
    localStorage.setItem("warehouse_import_data", JSON.stringify(importData));
  }, [importData]);

  return (
    <ImportContext.Provider value={{ importData, setImportData }}>
      {children}
    </ImportContext.Provider>
  );
};
