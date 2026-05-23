const { asyncHandler } = require("../../utils/async-handler");
const { getAIExplanations } = require("./service");

const list = asyncHandler(async (req, res) => {
  const explanations = await getAIExplanations();
  res.json({ data: explanations });
});

module.exports = { list };
