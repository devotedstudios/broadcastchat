var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql'); 

var HISTORY_LENGTH = 100;

http.listen(3000, function(){
  console.log('listening on *:3000');
});

var databaseName = "broadcastchat";

var con;

function connectToDB() {
	con = mysql.createConnection({
		host: "broadcastchatrds.cxf55nt0ovw1.us-west-1.rds.amazonaws.com",
		user: "admin",
		password: "bUFB5SabYP7RD32x"
	});

	con.connect(function(err) {
		if (err) {
			console.log("Couldnt connect to MySQL!");
			setTimeout(connectToDB, 10000);
		}
		else 
			console.log("Connected to MySQL database!");

		con.query("use "+databaseName, function (err, result) {
			if (err)
				console.log("Error trying to use database  "+databaseName);
			else
				console.log("Using database "+databaseName);
		});
	});                            
                                          
	con.on('error', function(err) {
		console.log('db error', err);
		if(err.code === 'PROTOCOL_CONNECTION_LOST') {
			connectToDB();                        
		} else {                                     
			throw err;                                  
		}
	});
}

connectToDB();

io.on('connection', function(socket){
	console.log('a user connected');
	  
	socket.on('join-channel', function(room) {
		var rooms = Object.keys(socket.rooms);
		for(var i=0;i<rooms.length;i++) {
			this.leave(rooms[i]);
		}
		
		console.log('Client joined room: ' + room);
			
		this.join(room);

		getMessagesFromDatabase(room,
			function(messages) { 
				socket.emit("chat-message",JSON.stringify(messages)); 
			}
		);
		
    });
	
	socket.on('chat-message', function(msg){
		var room = Object.keys(socket.rooms)[0];
		emitMessage(room, msg);
	});
});

function emitMessage(roomID, msg) {
	console.log('New message(RoomID = '+roomID+'): ' + msg);
	io.sockets.in(roomID).emit('chat-message', JSON.stringify([msg]));
	saveMessageToDatabase(roomID,msg);
}

function saveMessageToDatabase(roomID, msg) {
	msg = msg.replace("'","''");
	con.query("insert into messages(message, date, roomid) values('"+msg+"', now(), "+roomID+")", function (err, result) {
		if (err)
			console.log("Couldnt save message: "+msg+" - "+err);
  });
}

function getMessagesFromDatabase(roomID, functionToExecute) {
	con.query("select message from messages where roomid = " + roomID + " order by id asc", function (err, result) {
		if (err)
			console.log("Couldnt load messages for room: " + roomID);
		else {
			var resultArray = new Array(result.length);
			for(var i=0;i<result.length && i<HISTORY_LENGTH;i++) {
				resultArray[i] = result[i]["message"];
			}
			functionToExecute(resultArray);
		}
	});
}