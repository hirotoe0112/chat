class Chat{
  constructor(socket){
    this.socket = socket;
  }

  //メッセージ送信
  sendMessage(room, text){
    var message = {
      room: room,
      text: text
    };
    this.socket.emit('message', message);
  }

  //ルーム変更
  changeRoom(room){
    this.socket.emit('join', {
      newRoom: room
    });
  };

  //チャットコマンドの処理
  processCommand(command){
    var words = command.split(' ');
    //入力されたコマンドが何か解析する
    var command = words[0].substring(1, words[0].length).toLowerCase();
    var message = false;
    switch(command){
      case 'join':
        //配列の最初の要素を削除
        words.shift();
        var room = words.join(' ');
        this.changeRoom(room);
        break;
      case 'nick':
        words.shift();
        var name = words.join(' ');
        this.socket.emit('nameAttempt', name);
        break;
      default:
        message = 'Unrecognized command';
    }
    return message;
  }
}