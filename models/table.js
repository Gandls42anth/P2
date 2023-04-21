// require mongoose, a popular MongoDB library for nodejs
// Mongoose connects in the app.js file. Once mongoose is connected,
// it stays connected across all of the files in this project
// As long as you import this after you have connected,
// then mongoose will give you the active DB connection which is what we want
const mongoose = require('mongoose');

// variable to hold our Model
// A Model is our data structure to handle data. This can be an object, JSON, XML or anything else.
// A mongoDB model is a Mongo database structure with the API attached
// That is, a model has built-in functions for its data structure like find, findOne, etc.
// Usually you will retrieve data from the database through the Model object
let tableModel = {};

/* While Mongo is a schema-less database, meaning we can just store arbitrary objects in it,
   Mongoose does implement a schema system. If you wanted to just store arbitrary objects you
   could just use the mongoDB NodeJS driver: https://www.npmjs.com/package/mongodb
   Information about the differences between MongoDB Driver and Mongoose found here:
   https://www.mongodb.com/developer/article/mongoose-versus-nodejs-driver/
   The schema enforces a semi-rigid format on our data so that it is more of a "known quantity".
   This puts us somewhere between the very rigid SQL format and the very loose Mongo format.
   To create the schema we give it an object. Each top level key (like name, bedsOwned,
   and createdDate) defines a variable our objects can have. We then use individual objects
   to define the features and parameters of each one of those variables.
   For our name, we define a type of String. This means name is a string. Since mongo
   stores javascript objects, the type usually does not matter. However, this is something
   added by Mongoose to clarify what each variable should contain. We also give it the required
   option, which means every object in the cat database MUST have a name. We set the trim
   option to true, which will remove trailing and leading whitespace from the string. Finally
   we set the unique option to true. This means that there cannot be two cats with the same name.
   For our bedsOwned, we say it is a number. We set the minimum value to 0. We say it is required.
   For our createdDate, we want to store the time that the cat was first added to the database.
   Rather than figure that out in our own code when we create each cat, we can instead set
   it's default to the Date.now function. When a new cat is made, it will execute the default
   function and return the current date.
*/
const TableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },

  Hand: {
    type: [Number],
    required: true,
  },
  Pot: {
    type: Number,
  },
  curBet: {
    type: Number,
  },

  players: {
    type: [String],
  },
});
// Create the cat model based on the schema. You provide it with a custom discriminator
// (the name of the object type. Can be anything)
// and the schema to make a model from.
// Look at the model variable definition above for more details.
tableModel = mongoose.model('Table', TableSchema);

// We only want to export the cat model, so we can overwrite the entire exports object.
module.exports = tableModel;
