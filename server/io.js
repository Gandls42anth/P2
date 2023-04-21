/* To hook up socket, we need to import the http library and the Server
    class from the socket.io library. Although socket.io works with
    Express, we need to have the http library to hook it up.
*/
const http = require('http');
const { Server } = require('socket.io');

/* We are also going to make a file-scoped 'io' variable in which to
    store our io server. This is simply so that we can use the io
    server from various functions in this file without having to
    pass it in as a parameter to each one.
*/
let io;

/* This handleChatMessage function takes in a message and "emits" it 
    to a specific channel in our socket.io system. Clients can choose to 
    subscribe to specific channels, as seen in the /hosted/client.js file.
*/
const handleChatMessage = (msg) => {
    io.emit(msg.channel, msg.message);
};

const handlePing = (ping) => {
    io.emit(ping.channel, ping);
}

const reversePing = (ping) => {
    io.emit(ping.channel, ping);
}


/* This setup function takes in our express app, adds Socket.IO to it,
    and sets up event handlers for our io events.
*/
const socketSetup = (app) => {


    io.emit('general',)
    /* To create our Socket.IO server with our Express app, we first
        need to have the http library create a "server" using our Express
        app as a template. We then hand that server off to Socket.IO which
        will generate for us our IO server.
    */
    const server = http.createServer(app);
    io = new Server(server);

    /* Socket.IO is entirely built on top of an event system. Our server
        can send messages to clients, which trigger events on their side.
        In the same way, clients can send messages to the server, which
        trigger events on our side.

        The first event is the 'connection' event, which fires each time a
        client connects to our server. The event returns a "socket" object
        which represents their unique connection to our server.
    */
    io.on('connection', (socket) => {

        //When a user connects, they emit some kind of ping that asks all other users their name


        console.log('a user connected');

        /* With the socket object, we can handle events for that specific
            user. For example, the disconnect event fires when the user
            disconnects (usually by closing their browser window).
        */
        socket.on('disconnect', () => {
            console.log('a user disconnected');
        });

        /* We can also create custom events. For example, the 'chat message'
            event name is just one we made up. As long as the client and the
            server both know to use that name, we can use it.

            Here, whenever the user sends a message in the 'chat message'
            event channel, we will handle it with handleChatMessage.
        */


        socket.on('chat message', handleChatMessage);
        socket.on('ping', handlePing)
        socket.on('reverse ping', reversePing);
    });

    /* Finally, after our server is set up, we will return it so that we
        can start it in app.js.
    */
    return server;
};

// We only export the one function from this file, just like in router.js
module.exports = socketSetup;