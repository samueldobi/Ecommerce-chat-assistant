// Load environment variables from .env file (must be first import)
import 'dotenv/config'
// Import Express framework for creating web server
import express, { Express, Request, Response } from "express"
// Import MongoDB client for database connection
import { MongoClient } from "mongodb"
// Import our custom AI agent function
import { callAgent } from './agent'

// Create Express application instance
const app: Express = express()
// Import CORS middleware for handling cross-origin requests
import cors from 'cors'
// Enable CORS for all routes (allows frontend to call this API)
app.use(cors())
// Enable JSON parsing for incoming requests (req.body will contain parsed JSON)
app.use(express.json())

// Create MongoDB client using connection string from environment variables
const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string)

async function startServer(){
    try{
        await client.connect();
        await client.db("Ecommerce-app").command({ ping: 1 });
        console.log("Connected to MongoDB")

        // Defining route endpoints
        app.get( "/", (req: Request, res: Response) => {
            res.send("Welcome to the Ecommerce Chat Assistant API") 
        });
        app.post("/chat", async (req: Request, res: Response) => {
            const initialMessage = req.body.message;
            const threadId = Date.now().toString(); 
            console.log(initialMessage);
            try {
                const response = await callAgent(initialMessage, threadId, client);
                res.json({ threadId, response });
            } catch (error) {
                console.error("Error in /chat:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
        app.post("/chat/:threadId", async (req: Request, res: Response) => {
            const threadId = req.params;
            const message = req.body;
            try{
                const response = await callAgent(message, threadId, client);
                res.json({response})
            }catch(error){
                console.error("Error in chat", error)
                res.status(500).json({ error: "Internal Server Error" });
            }
        });

        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () =>{
            console.log(`Server is running on ${PORT}`)
        });


    }catch(error){
    console.error("Error connecting to mongodb:", error);
    process.exit(1);
    }
};
startServer();