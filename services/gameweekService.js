const Gameweek = require("../models/Gameweek");
const { updateGameweekPoints } = require("./fantasyScoring");

async function startGameweek(number, startDate, endDate) {
  return await Gameweek.create({
    number,
    startDate,
    endDate,
    isActive: true,
    isClosed: false,
    isCalculated: false,
  });
}

async function closeGameweek(id) {
  return await Gameweek.findByIdAndUpdate(id, { isClosed: true }, { new: true });
}

async function calculateGameweek(id) {
  const gameweek = await Gameweek.findById(id);
  if (!gameweek) throw new Error("Gameweek not found");
  if (gameweek.isCalculated) return gameweek;

  await updateGameweekPoints(id);

  gameweek.isCalculated = true;
  await gameweek.save();
  return gameweek;
}

module.exports = { startGameweek, closeGameweek, calculateGameweek };