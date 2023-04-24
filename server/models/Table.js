
const mongoose = require('mongoose');

let tableModel = {};

const TableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },

  hand: {
    type: [Number],
    required: true,
  },
  Pot: {
    type: Number,
  },
  curBet: {
    type: Number,
  },

  deck: {
    type: [Number]
  },
  //Players and spectators are just arrays of strings with their usernames, this allows a reference to their objects which are in a different database
  players: {
    type: [String],
  },
  spectators: {
    type: [String],
  },
  inGame: {
    type: Boolean,
  }
});
// Create the cat model based on the schema. You provide it with a custom discriminator
// (the name of the object type. Can be anything)
// and the schema to make a model from.
// Look at the model variable definition above for more details.
tableModel = mongoose.model('Table', TableSchema);

// We only want to export the cat model, so we can overwrite the entire exports object.
module.exports = TableSchema;