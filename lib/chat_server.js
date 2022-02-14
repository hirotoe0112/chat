var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server){
  //Socket.IOサーバを起動し既存のHTTPサーバに相乗りする
  io = socketio(server);

  //io.set('log level', 1);

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
      //console.log(io.sockets.adapter.rooms);
      var arr = Array.from(io.sockets.adapter.rooms);
      var filtered = arr.filter(room => !room[1].has(room[0]));
      var res = filtered.map(i => i[0]);
      socket.emit('rooms', res);
    });

    //ユーザが接続を断ったときのクリーンアップロジック
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
}

//ゲスト名割り当て
function assignGuestName(socket, guestNumber, nickNames, namesUsed){
  //ゲスト名生成
  var name = 'Guest' + guestNumber;

  //ゲスト名とクライアントの接続IDを関連付ける
  nickNames[socket.id] = name;

  //ユーザにゲスト名を知らせる
  socket.emit('nameResult', {
    success: true,
    name: name
  });

  //使用済み名前リストに追加
  namesUsed.push(name);

  //カウンタインクリメント
  return guestNumber + 1;
}

//ルームへ参加
function joinRoom(socket, room){
  //ルームへ参加させる
  socket.join(room);

  //ユーザがルームに参加したことを記録する
  currentRoom[socket.id] = room;

  //ユーザに新しいルームに参加したことを知らせる
  socket.emit('joinResult', {room: room});

  //ルームにいる他のユーザにユーザが参加したことを知らせる
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  });

  //ルーム内に他に誰がいるのか判定
  //var usersInRoom = io.sockets.clients(room);
  var usersInRoom = io.sockets.adapter.rooms[room];

  //他にユーザがいる場合、概要を作成
  if(usersInRoom != undefined && usersInRoom.length > 1){
    var usersInRoomSummary = '"' + room + '"に移動しました。';
    for(var index in usersInRoom){
      var userSocketId = usersInRoom[index].id;
      if(userSocketId != socket.id){
        if(index > 0){
          usersInRoomSummary += ', ';
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    socket.emit('message', {text: usersInRoomSummary});
  }
}

//名前変更要求処理
function handleNameChangeAttempts(socket, nickNames, namesUsed){
  //nameAttemptイベントリスナー
  socket.on('nameAttempt', function(name){
    if(name.indexOf('Guest') == 0){
      //Guestで始まる名前は不可
      socket.emit('nameResult', {
        success: false,
        message: '"Guest"から始まる名前は使用できません。'
      });
    }else{
      if(namesUsed.indexOf(name) == -1){
        //使用済み名前一覧に含まれていない場合は登録する
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        //変更前の名前を削除
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        //ルームの他のユーザに名前の変更を通知
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: '名前変更：' + previousName + '⇒' + name + '.'
        });
      }else{
        //使用済み名前は不可
        socket.emit('nameResult', {
          success: false,
          message: 'その名前は既に使用されています。'
        });
      }
    }
  });
}

//メッセージ送信要求処理
function handleMessageBroadcasting(socket){
  //messageイベントリスナー
  socket.on('message', function(message){
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ': ' + message.text
    });
  });
}

//ルーム作成
function handleRoomJoining(socket){
  //joinイベントリスナー
  socket.on('join', function(room){
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

//接続断処理
function handleClientDisconnection(socket){
  //disconnectイベントリスナー
  socket.on('disconnect', function(){
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}