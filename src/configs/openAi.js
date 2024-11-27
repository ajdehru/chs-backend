const { ChatOpenAI } = require("@langchain/openai");

const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPEN_AI_KEY || "",
  temperature: 0.9,
  modelName: "gpt-3.5-turbo",
  maxTokens:1000
});

module.exports = { chatModel };
