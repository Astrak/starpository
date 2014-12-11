
var express=require('express'),
	app=express(),
	server=require('http').Server(app),
	io=require('socket.io')(server),
	serverPort=process.env.OPENSHIFT_NODEJS_PORT||8080,
	serverIpAddress=process.env.OPENSHIFT_NODEJS_IP||'127.0.0.1',
	players=[];

/**** SERVER ****/
server.listen(serverPort,serverIpAddress,function(){
	console.log(heure()+'Running, listening on '+serverIpAddress+', port '+serverPort);
});

/**** CONSOLE DEV INFOS ****/
app.all('*',function(req,res,next){
	console.log(heure()+req.method+req.path);
	next();
})


/**** ROUTER ****/
.use(express.static(__dirname+'/fichiers'));


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