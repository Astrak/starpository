Array.prototype.clean=function(deleteValue){
  for (var i=0;i<this.length; i++) {
    if (this[i].id==deleteValue) {         
      this.splice(i,1);
      i--
    }
  }
  return this;
};
var express=require('express'),
	serverPort=process.env.OPENSHIFT_NODEJS_PORT||8080,
	serverIpAddress=process.env.OPENSHIFT_NODEJS_IP||'127.0.0.1',
	app=express(),
	server=require('http').Server(app),
	io=require('socket.io')(server),
	players=[];
server.listen(serverPort,serverIpAddress,function(){
	console.log(heure()+'Running, listening on '+serverIpAddress+', port '+serverPort);
});
app.all('*',function(req,res,next){
	console.log(heure()+req.method+req.path);
	next();
})
.use(express.static(__dirname+'/fichiers'));
io.on('connection',function(socket){
	socket.on('wantspawn',function(){
		players.push({
			id:socket.id,
			position:{
				x:0,
				y:0,
				z:0
			},
			quaternion:{
				x:0,
				y:0,
				z:0,
				w:0
			}
		});
		socket.emit('newplayer',players)
	});//wantspawn
	setInterval(function(){
			socket.emit('update',players);
		},30);
	socket.on('report',function(reporter){
		for(var i=0;i<players.length;i++){
			if(players[i].id===reporter.id){
				players[i].position=reporter.position;
				players[i].quaternion=reporter.quaternion;
				break;
			}
		}
	});//update
	socket.on('disconnect',function(){
		players.clean(socket.id);
		socket.broadcast.emit('leaving',socket.id);
	});//disconnect
});
function heure(){
	var semaine=['Sun','Mon','Tue','Wed','Thi','Fri','Sat'],
		date=new Date(),
		d=date.getDay(),
		h=(date.getHours()).toString(),
		m=(date.getMinutes()).toString(),
		s=(date.getSeconds()).toString(),
		ms=(date.getMilliseconds()).toString();
	return semaine[d]+' '+h+':'+m+':'+s+':'+ms+' '
}