var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {}; //ファイルのデータをキャッシュするのに使う

var server = http.createServer(function(request, response){
  var filePath = false;
  if(request.url == '/'){
    filePath = 'public/index.html';
  }else{
    filePath = 'public' + request.url;
  }
  var absPath = './' + filePath;
  serverStatic(response, cache, absPath);
})

server.listen(3000, function(){
  console.log('Server listening on port 3000');
});

//ファイルを返す
function sendFile(response, filePath, fileContents){
  response.writeHead(200, {"content-type":mime.getType(path.basename(filePath))});
  response.end(fileContents);
}

//メモリキャッシュを返す
function serverStatic(response, cache, absPath){
  if(cache[absPath]){
    sendFile(response, absPath, cache[absPath]);
    return;
  }

  //読み込みメソッドがファイルの存在確認を行っているため、存在確認をせずいきなりreadする
  fs.readFile(absPath, function(err, data){
    if(err){
      send404(response);
    }else{
      cache[absPath] = data;
      sendFile(response, absPath, data);
    }
  });
}

//404
function send404(response){
  response.writeHead(404, {'Content-Type':'text/plain'});
  response.write('Error 404: resource not found.');
  response.end();
}

var charServer = require('./lib/chat_server');
charServer.listen(server);