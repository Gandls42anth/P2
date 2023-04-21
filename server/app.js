/* Other than the commented parts, this file is the exact same as previous
  demos (such as Simple-MVC-Templates). As such, things other than the
  socket io portions will not be explained here.

  Socket.IO (https://socket.io/) is a library that allows for real-time,
  bi-directional communication between server and client. To do this, it
  predominantly uses the WebSocket API, which is built into most browsers.
  https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
  It also supports other, alternative methods in case the WebSocket API is
  not available.

  Basically, it opens a two way connection between the client and server.
  Unlike traditional http(s) connections, where the server can only respond
  once for each request that the client makes, WebSockets (and Socket.IO)
  allow our server to send messages to the client without them asking for
  them. This allows for our server to notify the client of updates without
  them constantly asking us for them.

  This is useful for real-time applications like games and other web
  experiences, as well as any scenario where the server needs to notify
  clients without them constantly asking for information.
*/
const path = require('path');
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const expressHandlebars = require('express-handlebars');

const router = require('./router.js');

const mongoose = require('mongoose');

const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1/simpleMVCExample';
mongoose.connect(dbURI).catch(err => {
  if (err) {
    console.log('Could not connect to database');
    throw err;
  }
});

/* Here we are importing our /server/io.js file, which exports a single
  function called socketSetup. This is very similar to the line above
  where we import the router function from router.
*/
const socketSetup = require('./io.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const app = express();

app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted/`)));
app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));

app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.engine('handlebars', expressHandlebars.engine({
  defaultLayout: '',
}));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/../views`);

router(app);

/* The socket.io library allows us to add socket.io to our existing
  http or express servers. Look at the /server/io.js file now to see
  how this is working. The function then returns a server that we can
  start that will have socket.io along with everything else.
*/
const server = socketSetup(app);

// Then we start the server
server.listen(port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Listening on port ${port}`);
});
