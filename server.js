Array.prototype.clean=function(deleteValue){
  for(var i=0;i<this.length;i++){if(this[i].id==deleteValue){this.splice(i,1);i--}}
  return this;
};
var express=require('express'),
	app=express(),
	bodyParser=require('body-parser'),
	cookieParser=require('cookie-parser'),
	server=require('http').Server(app),
	io=require('socket.io')(server),
	session=require('express-session'),
	sql=require('mysql'),
	mySqlClient=sql.createConnection({
		host:process.env.OPENSHIFT_MYSQL_DB_HOST||'127.0.0.1',
      	port:process.env.OPENSHIFT_MYSQL_DB_PORT||'3306',
		user:process.env.OPENSHIFT_MYSQL_DB_USERNAME||'root',
		password:process.env.OPENSHIFT_MYSQL_DB_PASSWORD||'root',
		database:'starpot',
		charset:'utf8'
	}),
	serverPort=process.env.OPENSHIFT_NODEJS_PORT||8080,
	serverIpAddress=process.env.OPENSHIFT_NODEJS_IP||'localhost',
	players=[];

app.use(express.query())
.use(cookieParser())
.use(bodyParser.json())
.use(bodyParser.urlencoded({
  extended: true
}))
.use(session({
	name:'authentified',
	secret:'ssh',
	resave:false,
	saveUninitialized:true
}));

/**** SERVER ****/
server.listen(serverPort,serverIpAddress,function(){
	console.log(heure()+'Running, listening on '+serverIpAddress+', port '+serverPort);
});

/**** CONSOLE DEV INFOS ****/
app.all('*',function(req,res,next){
	console.log(heure()+req.method+req.path);
	next();		
})

/**** MYSQL ****/
.post('/connect',function(req,res){
	if(req.body.action==='TestPseudo'){
		var query='SELECT NAME FROM accounts WHERE NAME="'+req.body.pseudo+'";';
		mySqlClient.query(query,function(err,result){
			if(err===null){
				result[0]?res.send('true'):res.send('false');
			}else{res.send(err)}
		});
	}else if(req.body.action==='Connexion'){
		var query='SELECT NAME,PASSWORD FROM accounts WHERE NAME="'+req.body.pseudo+'";';
		mySqlClient.query(query,function(err,result){
			if(err===null){
				if(result[0]){
					if(result[0].PASSWORD===req.body.password){
						req.session.authentication=true;
						res.send('connected');
					}else{res.send('wrong password');}
				}else{res.send('not registered')}
			}else{res.send(err)}
		});
	}else{
		var post={name:req.body.pseudo,password:req.body.password,mail:req.body.mail};
		mySqlClient.query('INSERT INTO accounts SET ?',post,function(err,result){
			err===null?res.send('check your mail'):res.send('subscription '+err);
		});
	}
})
.get('/simulation.html',function(req,res){
	if(req.session.authentication===true){
		res.sendFile(__dirname+'/fichiers/simulation.html')
	}else{res.sendFile(__dirname+'/fichiers/index.html')}
})

.use(express.static(__dirname+'/fichiers'));

/**** SOCKETS ****/
io.on('connection',function(socket){
	socket.on('wantspawn',function(){
		players.push({
			id:socket.id,
			position:{x:0,y:0,z:0},
			quaternion:{x:0,y:0,z:0,w:0}
		});
		socket.emit('newplayer',players)
	});
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
	});
	socket.on('disconnect',function(){
		players.clean(socket.id);
		socket.broadcast.emit('leaving',socket.id);
	});
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