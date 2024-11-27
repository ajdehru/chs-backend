const { chatModel } = require("../configs/openAi");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { symptomPrompt } = require("../utils/symptomPrompt");

const generateSymptomSummary = async (req, res) => {
  try {
    const { symptoms } = req.body; // Assume symptoms are sent in the request body
    if (!symptoms) {
      return res.status(400).json({ message: "Symptoms are required." });
    }

    console.log("Received symptoms:", symptoms);

    const formattedPrompt = await symptomPrompt.format({ symptoms });

    const outputParser = new StringOutputParser();
    const llmChain = symptomPrompt.pipe(chatModel).pipe(outputParser);

    let summary = "";
    for await (const chunk of await llmChain.stream({ symptoms })) {
      summary += chunk;
      global.io.emit("summary", { summary });
      res.write(chunk);
    }
    console.log("Generated summary:", summary);

    res.end();
  } catch (error) {
    console.error("Error in generateSymptomSummary:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { generateSymptomSummary };
