const express = require( 'express' );
const path = require( 'path' );
const http = require( 'http' );
const fs = require( 'fs' );
const socketio = require('socket.io');
const formatMessage = require('./public/chat/messages')
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./public/chat/users')
const botName = 'Chat.io Bot'
const app = express();


app.use( express.static( 'public' ) );
const server = http.createServer(app);
const io = socketio(server);

//Run when a client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        socket.emit('message',formatMessage(botName, 'Welcome to Chat.io'));

        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));
        
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    //Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //Runs at client disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if(user){
            io.to(user.room).emit('message',formatMessage(botName, `${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
        
    });
});
const index = fs.readFileSync( __dirname + '/public/chat/index.html', 'utf-8' );
const chat = fs.readFileSync( __dirname + '/public/chat/liveChat.html', 'utf-8' );

app.get( '/index', ( request, response ) => {
    response.send(index);
} );

app.get( '/liveChat', ( request, response ) => {
    response.send(chat);
} );


const PORT = 8080 || process.env.PORT;

server.listen(PORT, (error) => {
    if ( error ) { console.log( error ); }
    console.log( `Server is running on port ${PORT}`  );
});