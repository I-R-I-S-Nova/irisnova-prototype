const express = require("express");
const bodyParser = require("body-parser");
const { SessionsClient } = require("@google-cloud/dialogflow-cx");
const cors = require("cors");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 10000; // Use Render's port or default
// Enable CORS for your Netlify domain
app.use(cors({
  origin: '*', // In production, change to your Netlify domain
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(bodyParser.json());
// Load credentials from file or environment
let serviceAccount;
try {
 const credsPath = process.env.RENDER
  ? process.env.GOOGLE_CREDS_PATH || "google-creds.json"
  : "./google-creds.json";
  
  serviceAccount = JSON.parse(fs.readFileSync(credsPath));
  console.log("✅ Successfully loaded Google credentials");
} catch (error) {
  console.error("❌ Error loading credentials:", error.message);
  // Don't exit - try environment variable fallback
  try {
    if (process.env.GOOGLE_CREDENTIALS) {
      serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      console.log("✅ Successfully loaded Google credentials from environment");
    } else {
      throw new Error("No credentials found in environment");
    }
  } catch (envError) {
    console.error("❌ Fatal: No valid credentials available:", envError.message);
    process.exit(1);
  }
}
// Create SessionsClient with credentials
const client = new SessionsClient({
  credentials: serviceAccount,
});
// Dialogflow project config
const PROJECT_ID = "peaceful-web-456221-c0";
const LOCATION = "europe-west2";
const AGENT_ID = "a46d22c9-8e20-4764-9bd3-e2cbb1d54123";
const LANGUAGE_CODE = "en";
// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Nova Dialogflow server is running" });
});
// Main query endpoint
app.post("/query", async (req, res) => {
  try {
    const userQuery = req.body.query;
    if (!userQuery) {
      return res.status(400).json({ 
        error: "Missing query parameter",
        reply: "Sorry, I didn't receive any input." 
      });
    }
    
    const sessionId = Math.random().toString(36).substring(7);
    console.log(`Processing query: "${userQuery}" (Session: ${sessionId})`);
    const sessionPath = client.projectLocationAgentSessionPath(
      PROJECT_ID,
      LOCATION,
      AGENT_ID,
      sessionId
    );
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: userQuery,
        },
        languageCode: LANGUAGE_CODE,
      },
    };
    const [response] = await client.detectIntent(request);
    
    // Extract text responses from response messages
    const reply =
      response.queryResult.responseMessages
        .map((msg) => msg.text?.text?.[0])
        .filter(Boolean)
        .join(" ") || "Sorry, I had trouble understanding that.";
    console.log(`Response: "${reply}"`);
    res.json({ reply });
  } catch (error) {
    console.error("❌ Dialogflow CX error:", error.message);
    console.error(error.stack);
    res.status(500).json({ 
      error: error.message,
      reply: "Sorry, I had trouble understanding that." 
    });
  }
});
app.listen(port, () => {
  console.log(`Nova Dialogflow server running on port ${port}`);
});
