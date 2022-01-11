//バインドするデータ
let vueObj = {
  room: "",
  sendMessage:""
};

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
  var message = vueObj.sendMessage;
  var systemMessage;

  if(message.charAt(0) == '/'){
    //コマンドの場合はコマンドを処理して処理結果を画面に表示
    systemMessage = chatApp.processCommand(message);
    if(systemMessage){
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else {
    //コマンド以外の場合はチャットメッセージとして送信
    chatApp.sendMessage(vueObj.room, message);
    $('#messages').append(divEscapedContentElement(message));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }
  vueObj.sendMessage = "";
}

var socket = io.connect();

$(document).ready(function(){
  var chatApp = new Chat(socket);

  let app = new Vue({
    el:'#content',
    data:vueObj,
    methods:{
      send:function(event){
        processUserInput(chatApp, socket);
        this.focus();
      },
      enter:function(event){
        if(event.keyCode == 13){
          processUserInput(chatApp, socket);
          this.focus();
        }
      },
      focus:function(){
        this.$refs.defaultFocus.focus();
      }
    },
    mounted:function(){
        this.$refs.defaultFocus.focus();
    }
  });

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
    vueObj.room = result.room;
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
});