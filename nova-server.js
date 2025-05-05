const express = require("express");
const bodyParser = require("body-parser");
const { SessionsClient } = require("@google-cloud/dialogflow-cx");
const cors = require("cors");

const app = express();
const port = 10000;

app.use(cors());
app.use(bodyParser.json());

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}');
} catch (err) {
  console.error('❌ Failed to parse service account JSON:', err);
  process.exit(1);
}

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
    const reply = response.queryResult.responseMessages
      .map((msg) => msg.text?.text?.[0])
      .filter(Boolean)
      .join(" ");

    res.json({ reply });
  } catch (error) {
    console.error("Dialogflow CX error:", error);
    res.status(500).json({ reply: "Sorry, I had trouble understanding that." });
  }
});

app.listen(port, () => {
  console.log(`Nova Dialogflow server running on port ${port}`);
});
