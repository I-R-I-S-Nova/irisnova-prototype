const express = require("express");
const bodyParser = require("body-parser");
const { SessionsClient } = require("@google-cloud/dialogflow-cx");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 10000;
app.use(cors());
app.use(bodyParser.json());
// Load credentials from environment
let serviceAccount;
try {
  if (process.env.GOOGLE_CREDENTIALS) {
    serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    console.log("✅ Successfully loaded Google credentials from environment");
  } else {
    throw new Error("GOOGLE_CREDENTIALS environment variable not found");
  }
} catch (error) {
  console.error("❌ Error loading credentials:", error.message);
  process.exit(1);
}
// Dialogflow project config
const PROJECT_ID = "peaceful-web-456221-c0";
const LOCATION = "europe-west2";
const AGENT_ID = "a46d22c9-8e20-4764-9bd3-e2cbb1d54123";
const LANGUAGE_CODE = "en";
// Initialize Dialogflow client with region-specific endpoint
const client = new SessionsClient({
  apiEndpoint: `${LOCATION}-dialogflow.googleapis.com`,
  credentials: serviceAccount,
});
console.log(`Using Dialogflow CX API endpoint: ${LOCATION}-dialogflow.googleapis.com`);
// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Nova Dialogflow server is running" });
});
app.post("/query", async (req, res) => {
  try {
    const userQuery = req.body.query;
    if (!userQuery) {
      return res.status(400).json({ 
        error: "Missing query parameter",
        reply: "Sorry, I didn't receive any input." 
      });
    }
    
    console.log(`Processing query: "${userQuery}"`);
    
    const sessionId = Math.random().toString(36).substring(7);
    console.log(`Session ID: ${sessionId}`);
    // Create the session path
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
    
    console.log("Sending request to Dialogflow...");
    const [response] = await client.detectIntent(request);
    console.log("Received response from Dialogflow");
    
    const reply =
      response.queryResult.responseMessages
        .map((msg) => msg.text?.text?.[0])
        .filter(Boolean)
        .join(" ") || "Sorry, I had trouble understanding that.";
    console.log(`Response: "${reply}"`);
    res.json({ reply });
  } catch (error) {
    console.error("❌ Dialogflow CX error:", error.message);
    if (error.details) {
      console.error("Error details:", error.details);
    }
    
    res.status(500).json({ 
      error: error.message,
      reply: "Sorry, I had trouble understanding that." 
    });
  }
});
app.listen(port, () => {
  console.log(`Nova Dialogflow server running on port ${port}`);
});
