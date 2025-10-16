import express from "express";
import documentsRouter from "./routes/documents.js";

const app = express();
app.use(express.json());

// Connect the /documents route
app.use("/documents", documentsRouter);

// Start the server
app.listen(3001, () => console.log("🚀 Server running on port 3001"));
