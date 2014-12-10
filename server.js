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
	app=express(),
	bodyParser=require('body-parser'),
	server=require('http').Server(app),
	io=require('socket.io')(server),
	sql=require('mysql'),
	mySqlClient=sql.createConnection({
		host:process.env.OPENSHIFT_MYSQL_DB_HOST || 'localhost',
      	port: process.env.OPENSHIFT_MYSQL_DB_PORT || '3306',
		user:process.env.OPENSHIFT_MYSQL_DB_USERNAME || 'adminjHtbzSB',
		password:process.env.OPENSHIFT_MYSQL_DB_PASSWORD || '59naStIcvMym',
		database:'starpot',
		charset:'utf8'
	}),
	serverPort=process.env.OPENSHIFT_NODEJS_PORT||8080,
	serverIpAddress=process.env.OPENSHIFT_NODEJS_IP||'127.0.0.1',
	players=[];
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); 
server.listen(serverPort,serverIpAddress,function(){
	console.log(heure()+'Running, listening on '+serverIpAddress+', port '+serverPort);
});
app.all('*',function(req,res,next){
	console.log(heure()+req.method+req.path);
	next();
})
.post('/connect',function(req,res){
	var action=req.body.action,
		pseudo=req.body.pseudo,
		mail=req.body.mail,
		password=req.body.password;
	//todo : check inputs
	if(action.value='subscription'){
		var query='INSERT INTO ACCOUNTS (mail,name,password) VALUES ('+mail+','+pseudo+','+password+');',
			sqlQuery=mySqlClient.query(query);
		sqlQuery.on('result',function(row){
			res.end(row);
		});
		sqlQuery.on('end',function(row){
			mySqlClient.end();
		});
		sqlQuery.on('error',function(error){
		});
	}else{
		var query='SELECT NAME,PASSWORD FROM ACCOUNTS WHERE name='+pseudo+' AND PASSWORD='+password+';',
			sqlQuery=mySqlClient.query(query);
		sqlQuery.on('result',function(row){
			res.end(row);
		});
		sqlQuery.on('end',function(row){
			mySqlClient.end();
		});
		sqlQuery.on('error',function(error){
		});
	}
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