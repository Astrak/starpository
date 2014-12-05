var express=require('express'),
	app=express();
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
}).listen(8080,function(){
	console.log(heure()+'Démarrage');
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