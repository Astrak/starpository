var express=require('express'),
	app=express(),
	serverPort=process.env.OPENSHIFT_NODEJS_PORT||8080,
	serverIpAddress=process.env.OPENSHIFT_NODEJS_IP||'127.0.0.1';
app.all('*',function(req,res,next){
	console.log(heure()+req.method+req.path);
	next();
})
.use(express.static(__dirname+'/fichiers'))
.get('/index',function(req,res){
	res.sendfile('./fichiers/index.html');
})
.get('/result',function(req,res){
	res.sendfile('./fichiers/result.html');
}).listen(serverPort,serverIpAddress,function(){
	console.log(heure()+'Running, listeing on '+serverIpAddress+', port '+serverPort);
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