
import dotenv from "dotenv";

dotenv.config();

// Define a type for the ENV object
type EnvConfig = {
    BASE_STOCK_API: string;
    STOCK_API_KEY: string;
};

// Export the ENV object with default values
export const ENV: EnvConfig = {
    BASE_STOCK_API: process.env.BASE_STOCK_API || "https://api.example.com",
    STOCK_API_KEY: process.env.STOCK_API_KEY || "your_stock_api_key",
};