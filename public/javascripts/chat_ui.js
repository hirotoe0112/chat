//HTMLタグをエスケープして表示
function divEscapedContentElement(message){
  return $('<div></div>').text(message);
}

//HTMLタグをタグとして表示
function divSystemContentElement(message){
  return $('<div></div>').html('<i>' + message + '</i>');
}

//ユーザ入力の処理
function processUserInput(chatApp, socket){
  var message = $('#send-message').val();
  var systemMessage;

  if(message.charAt(0) == '/'){
    //コマンドの場合はコマンドを処理して処理結果を画面に表示
    systemMessage = chatApp.processCommand(message);
    if(systemMessage){
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else {
    //コマンド以外の場合はチャットメッセージとして送信
    chatApp.sendMessage($('#room').text(), message);
    $('#messages').append(divEscapedContentElement(message));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }
  $('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function(){
  var chatApp = new Chat(socket);

  //名前変更要求の結果を表示
  socket.on('nameResult', function(result){
    var message;
    if(result.success){
      message = 'You are now known as ' + result.name + '.';
    } else {
      message = result.message;
    }
    $('#messages').append(divSystemContentElement(message));
  });

  //ルーム変更の結果を表示
  socket.on('joinResult', function(result){
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

  //受信したメッセージを表示
  socket.on('message', function(message){
    var newElement = $('<div></div>').text(message.text);
    $('#messages').append(newElement);
  });

  //利用できるルームのリストを表示
  socket.on('rooms', function(rooms){
    $('#room-list').empty();
    rooms.forEach(room => {
      if(room != ''){
        $('#room-list').append(divEscapedContentElement(room));
      }
    });

    //ルームをクリックしたら移動できるようにする
    $('#room-list div').click(function(){
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });

  //利用できるルームを定期的に問い合わせる
  setInterval(function(){
    socket.emit('rooms');
  }, 1000);

  //入力欄にフォーカス
  $('#send-message').focus();

  //入力ボタンを押したときの処理
  $('#send-button').click(function(){
    processUserInput(chatApp, socket);
    return false;
  });

  $('#send-message').keypress(function(e){
    if(e.keyCode == 13){
    processUserInput(chatApp, socket);
    return false;
    }
  })
});