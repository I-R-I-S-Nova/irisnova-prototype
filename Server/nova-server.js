// Express server for Dialogflow CX integration
const express = require("express");
const bodyParser = require("body-parser");
const { SessionsClient } = require("@google-cloud/dialogflow-cx");
const path = require("path");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Path to your downloaded service account key file
const KEY_PATH = path.join(__dirname, "peaceful-web-456221-c0-2cc64bf58651.json");

// Your Dialogflow CX project details
const PROJECT_ID = "peaceful-web-456221-c0";
const LOCATION = "europe-west2"; // or your region
const AGENT_ID = "a46d22c9-8e20-4764-9bd3-e2cbb1d54123
const LANGUAGE_CODE = "en";

const client = new SessionsClient({ keyFilename: KEY_PATH });

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
    console.error("Error with Dialogflow CX request:", error);
    res.status(500).json({ reply: "Sorry, I had trouble understanding that." });
  }
});

app.listen(port, () => {
  console.log(`Nova Dialogflow server running on port ${port}`);
});
