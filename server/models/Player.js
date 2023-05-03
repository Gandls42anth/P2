
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  hand: {
    type: [Number],
  },
  bet: {
    type: Number,
  },
  chips: {
    type: Number,
  },
  decision: {
    type: String,
  },
});
// Create the cat model based on the schema. You provide it with a custom discriminator
// (the name of the object type. Can be anything)
// and the schema to make a model from.
// Look at the model variable definition above for more details.
const playerModel = mongoose.model('Player', playerSchema);

// We only want to export the cat model, so we can overwrite the entire exports object.
module.exports = playerModel;
