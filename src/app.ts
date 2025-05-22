import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ChatbotRoutes from "./routes/chatbot.routes";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use("/api/chatbot", ChatbotRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));