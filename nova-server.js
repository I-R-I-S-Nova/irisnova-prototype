const express = require("express");
const { SessionsClient } = require("@google-cloud/dialogflow-cx");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = 10000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Load credentials from local file (dev) or secret mount (Render)
const credsPath = process.env.RENDER
  ? "/etc/secrets/google-creds.json"
  : "./google-creds.json";

const express = require("express");

const client = new SessionsClient({
  credentials: serviceAccount,
});

// Dialogflow project config
const PROJECT_ID = "peaceful-web-456221-c0";
const LOCATION = "europe-west2";
const AGENT_ID = "a46d22c9-8e20-4764-9bd3-e2cbb1d54123";
const LANGUAGE_CODE = "en";

app.post("/query", async (req, res) => {
  try {
    const userQuery = req.body.query;
    const sessionId = Math.random().toString(36).substring(7);

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
    const reply =
      response.queryResult.responseMessages
        .map((msg) => msg.text?.text?.[0])
        .filter(Boolean)
        .join(" ") || "Sorry, I had trouble understanding that.";

    res.json({ reply });
  } catch (error) {
    console.error("❌ Dialogflow CX error:", JSON.stringify(error, null, 2));
    res.status(500).json({ reply: "Sorry, I had trouble understanding that." });
  }
});

app.listen(port, () => {
  console.log(`Nova Dialogflow server running on port ${port}`);
});
