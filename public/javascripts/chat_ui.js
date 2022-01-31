var socket = io.connect();
var chatApp = new Chat(socket);

//バインドするデータ
let vueObj = {
  room: "",
  sendMessage:"",
  messages: [],
  rooms: []
};

let app = new Vue({
  el:'#content',
  data:vueObj,
  methods:{
    send:function(event){
      processUserInput(chatApp, socket);
      this.focus();
      this.scroll();
    },
    enter:function(event){
      if(event.keyCode == 13){
        processUserInput(chatApp, socket);
        this.focus();
      }
    },
    changeroom:function(event){
      chatApp.processCommand('/join ' + event.target.innerText);
      this.focus();
    },
    focus:function(){
      this.$refs.defaultFocus.focus();
    }
  },
  mounted:function(){
    this.$nextTick(function(){
      this.$refs.defaultFocus.focus();
    })
  },
  watch:{
    //メッセージが追加されるのを監視して下までスクロールする
    messages:function(newMessages, oldMessages){
      this.$nextTick(function(){
        this.$refs.messageArea.scrollTop = this.$refs.messageArea.scrollHeight;
      });
    }
  }
});

//メッセージ追加
function addMessage(message, isSystem, isSelf){
  var newdata = {value: message, isSystem: isSystem, isSelf: isSelf}
  vueObj.messages.push(newdata);
}

//ユーザ入力の処理
function processUserInput(chatApp, socket){
  var message = vueObj.sendMessage;
  var systemMessage;

  if(message.charAt(0) == '/'){
    //コマンドの場合はコマンドを処理して処理結果を画面に表示
    systemMessage = chatApp.processCommand(message);
    if(systemMessage){
      addMessage(systemMessage, true, false);
    }
  } else {
    //コマンド以外の場合はチャットメッセージとして送信
    chatApp.sendMessage(vueObj.room, message);
    addMessage(message, false, true);
  }
  vueObj.sendMessage = "";
}

//名前変更要求の結果を表示
socket.on('nameResult', function(result){
  var message;
  if(result.success){
    message = 'You are now known as ' + result.name + '.';
  } else {
    message = result.message;
  }
  addMessage(message, true, false);
});

//ルーム変更の結果を表示
socket.on('joinResult', function(result){
  vueObj.room = result.room;
  addMessage('Room changed', true, false);
});

//受信したメッセージを表示
socket.on('message', function(message){
  addMessage(message.text, false, false);
});

//利用できるルームのリストを表示
socket.on('rooms', function(rooms){
  vueObj.rooms = [];
  rooms.forEach(room => {
    if(room != ''){
      var newdata = {name: room};
      vueObj.rooms.push(newdata);
    }
  });
});

//利用できるルームを定期的に問い合わせる
setInterval(function(){
  socket.emit('rooms');
}, 1000);