const { chatModel } = require("../configs/openAi");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { symptomPrompt } = require("../utils/symptomPrompt");
const { sendResponse } = require("../utils");

const generateSymptomSummary = async (req, res) => {
  try {
    const { symptoms, age, height, weight } = req.body;
    console.log("Received data:", req.body);

    if (!symptoms || !age || !height || !weight) {
      return res.status(400).json({ message: "All fields (symptoms, age, height, weight) are required." });
    }

    const formattedPrompt = await symptomPrompt.format({ symptoms, age, height, weight });

    const outputParser = new StringOutputParser();
    const llmChain = symptomPrompt.pipe(chatModel).pipe(outputParser);

    let summary = "";

    for await (const chunk of await llmChain.stream({ symptoms, age, height, weight })) {
      summary += chunk;
      global.io.emit("summary", { summary });

      res.write(chunk);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    console.log("Generated summary:", summary);

    res.end();
  } catch (error) {
    console.error("Error in generateSymptomSummary:", error);
    if (!res.headersSent) {
      return sendResponse(res, 500, "An error occurred while generating the symptom report.");
    }
  }
};

module.exports = { generateSymptomSummary };
