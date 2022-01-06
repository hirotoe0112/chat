var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames;
var namesUsed = [];
var currentRoom;

exports.listen = function(server){
  //Socket.IOサーバを起動し既存のHTTPサーバに相乗りする
  io = socketio.listen(server);

  io.set('log level', 1);

  //各ユーザ接続の処理方法を定義
  io.sockets.on('connection', function(socket){
    //ゲスト名割り当て
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

    //Lobbyに入れる
    joinRoom(socket, 'Lobby');

    //メッセージ送信要求の処理
    handleMessageBroadcasting(socket, nickNames);

    //名前変更要求の処理
    handleNameChangeAttempts(socket, nickNames, namesUsed);

    //ルーム作成／変更要求の処理
    handleRoomJoining(socket);

    //ユーザの要求に応じて使用されているルームのリストを提供
    socket.on('rooms', function(){
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    //ユーザが接続を断ったときのクリーンアップロジック
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
}