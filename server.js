var express=require('express'),
	serverPort=process.env.OPENSHIFT_NODEJS_PORT||8080,
	serverIpAddress=process.env.OPENSHIFT_NODEJS_IP||'127.0.0.1',
	app=express(),
	server=require('http').Server(app),
	io=require('socket.io')(server);
server.listen(serverPort,serverIpAddress,function(){
	console.log(heure()+'Running, listening on '+serverIpAddress+', port '+serverPort);
});
app.all('*',function(req,res,next){
	console.log(heure()+req.method+req.path);
	next();
})
.use(express.static(__dirname+'/fichiers'));
io.on('connection',function(socket){
	console.log('nouveau joueur !!!!!!!!');
	socket.on('spawn',function(socket){
		console.log('player has spawn at '+socket.x)
	})
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