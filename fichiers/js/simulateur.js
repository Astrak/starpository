var socket=io.connect(/*"http://starpot-starpot.rhcloud.com:8000"*/),
	socketId,
	otherPlayers=[];

onload=function(){
	var init=function(players){
		var scene=new THREE.Scene(),ship,
			wrapper=new THREE.Object3D(),
			renderer=new THREE.WebGLRenderer(),
			camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,6,2500),
			controls=new THREE.SimulatorControls(renderer,ship,camera),
			pL=new THREE.PointLight(0xffffff,4,100000),
			mat=new THREE.MeshLambertMaterial({color:0xff0000}),
			box=new THREE.Mesh(new THREE.BoxGeometry(10,10,10),mat),
			skybox=new THREE.Mesh(new THREE.SphereGeometry(100,20,20),new THREE.MeshLambertMaterial({
				map:THREE.ImageUtils.loadTexture('img/mw_mr.jpg'),
				color:0x000000,
				emissive:0xbbbbbb,
				depthWrite:false,
				side:THREE.BackSide
			})),
			JSON=new THREE.JSONLoader(),
			box2=new THREE.Mesh(new THREE.BoxGeometry(5,5,5),new THREE.MeshLambertMaterial({color:0x00ff00}));
		JSON.load('js/JSON/TIE.js',function(geometry){
			ship=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:0xffffff}));
				scene.add(ship);
			setInterval(function(){
				socket.emit('report',{
					id:socketId,
					position:{
						x:-wrapper.position.x,
						y:-wrapper.position.y,
						z:-wrapper.position.z,
					},
					quaternion:{
						x:ship.quaternion.x,
						y:ship.quaternion.y,
						z:ship.quaternion.z,
						w:ship.quaternion.w
					}
				});
			},30);
		});
		pL.position.set(10,20,0);
		box.position.z=-10;
		box2.position.x=-20;
		camera.position.z=10;
		scene.add(camera,wrapper,skybox);
		wrapper.add(box,box2,pL);
		function render(){
			controls.update(ship,wrapper);
			requestAnimationFrame(render);
			renderer.render(scene,camera);
		}
		render();
		renderer.setSize(innerWidth,innerHeight);
		document.body.appendChild(renderer.domElement);
		socket.on('update',function(players){
			if(typeof ship!=='undefined'){
				if(players.length>otherPlayers.length+1){
					otherPlayers.push(new THREE.Mesh(
						ship.geometry.clone(),
						ship.material.clone()));
					if(players[players.length-1].id===socketId){
						otherPlayers[otherPlayers.length-1].userData.id=players[players.length-2].id;
					}else{
						otherPlayers[otherPlayers.length-1].userData.id=players[players.length-1].id;
					}
					wrapper.add(otherPlayers[otherPlayers.length-1]);
				}
				for(var i=0;i<players.length;i++){
					if(players[i].id!==socketId){
						for(var j=0;j<otherPlayers.length;j++){
							if(otherPlayers[j].userData.id!==players[i].id){
								continue
							}else{
							otherPlayers[j].position.set(
								players[i].position.x,
								players[i].position.y,
								players[i].position.z);
							otherPlayers[j].quaternion.set(
								players[i].quaternion.x,
								players[i].quaternion.y,
								players[i].quaternion.z,
								players[i].quaternion.w)
							}
						}
					}
				}
			}
		});
		socket.on('leaving',function(leaver){
			for(var i=0;i<otherPlayers.length;i++){
				if(otherPlayers[i].userData.id===leaver){
					wrapper.remove(otherPlayers[i]);
					otherPlayers.splice(i,1);
					break
				}
			}
		});
	};
	var button=document.createElement('button');
	button.innerHTML='INIT';
	document.body.appendChild(button);
	button.addEventListener('click',function(){
		socket.emit('wantspawn');
		document.body.removeChild(button);
		document.body.removeChild(document.querySelector('h1'));
	},false);
	socket.on('newplayer',function(players){
		if(typeof socketId==='undefined'){
			socketId=players[players.length-1].id;
			init(players);
		}
	});
}
THREE.SimulatorControls=function(renderer,ship,camera){
	var key=[],lmb,mmb,rmb,
		speed=new THREE.Vector3(0,0,0),
		rotateStart=new THREE.Vector3(0,0,1),
		rotateEnd=new THREE.Vector3(),
		H=innerHeight/2,W=innerWidth/2,
		quaternion=new THREE.Quaternion(),
		roll=new THREE.Vector3(0,0,-1),
		cameraTarget=new THREE.Vector3(0,0,0),
		raycaster=new THREE.Raycaster();
	this.update=function(ship,wrapper){
		if(typeof ship!=='undefined'){
			/*SERVER UPDATE AND CLIENT GUESSING*/
			
			/*CLIENT UPDATE*/
			raycaster.set(ship.position,new THREE.Vector3().subVectors(ship.position,camera.position).normalize());
			raycaster.far=1;
			var boom=raycaster.intersectObject(wrapper,true);
			if(boom[0])ship.visible=false;
			if(rmb){
				quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(
						new THREE.Vector3().crossVectors(rotateStart,rotateEnd).normalize(),
						-.0005*Math.acos(rotateStart.dot(rotateEnd)/rotateEnd.length())));
			}
			if(key[65]||key[69]){
				var angle=.001;
				key[65]?angle:angle=-angle;
				quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(
						new THREE.Vector3().subVectors(camera.position,ship.position).normalize(),
						angle));
			}
			if(key[90]){speed.add(new THREE.Vector3().copy(camera.up).setLength(.001))}
			if(key[81]){speed.add(new THREE.Vector3().subVectors(camera.position,cameraTarget).cross(camera.up).setLength(.001))}
			if(key[68]){speed.add(new THREE.Vector3().subVectors(camera.position,cameraTarget).cross(camera.up).setLength(-.001))}
			if(key[83]){speed.add(new THREE.Vector3().copy(camera.up).setLength(-.001))}
			if(key[32]){speed.add(new THREE.Vector3().subVectors(cameraTarget,camera.position).setLength(.005))}
			if(key[9]){speed.add(new THREE.Vector3().subVectors(camera.position,cameraTarget).setLength(.002))}
			if(lmb){
				raycaster.far=100;
				var array=raycaster.intersectObject(wrapper,true);
				if(array[0])wrapper.remove(array[0].object);
			}
			wrapper.position.sub(speed);
			cameraTarget.copy(ship.position);
			ship.setRotationFromQuaternion(new THREE.Quaternion().multiplyQuaternions(quaternion,ship.quaternion).normalize());
			camera.position.applyQuaternion(quaternion);
			camera.up.applyQuaternion(quaternion);
			camera.lookAt(ship.position);
			rotateEnd.applyQuaternion(quaternion);
			rotateStart.applyQuaternion(quaternion);
		}
	}
	function getMouseOnBall(e){
		var X=e.clientX,Y=e.clientY,
			vector=new THREE.Vector3((X-W)/(Math.sqrt(H*H+W*W)),-(Y-H)/(Math.sqrt(H*H+W*W)),0);
		length=vector.length();
		vector.z=Math.sqrt(1-length*length);
		var way=new THREE.Vector3().subVectors(camera.position,cameraTarget).setLength(vector.z);
		way.add(way.clone().cross(camera.up).setLength(-vector.x));
		way.add(camera.up.clone().setLength(vector.y));
		return way
	}
	function onMouseDown(e){
		switch(e.button){
			case 0:lmb=true;break;
			case 1:mmb=true;break;
			case 2:rmb=true;
				rotateEnd=getMouseOnBall(e);
				break;
		}
	}
	function onMouseMove(e){
		if(rmb){rotateEnd=getMouseOnBall(e)}
	}
	function onMouseUp(e){
		switch(e.button){
			case 0:lmb=false;break;
			case 1:mmb=false;break;
			case 2:rmb=false;break;
		}
	}
	function onKey(e){
		key[e.keyCode]=e.type==='keydown';
		if(key[9])e.preventDefault();
	}
	function onContextMenu(e){e.preventDefault()}
	function onWindowResize(){
		H=innerHeight/2;
		W=innerWidth/2;
		camera.aspect=W/H;
		camera.updateProjectionMatrix();
		renderer.setSize(2*W,2*H);
	}
	addEventListener('mouseup',onMouseUp,false);
	addEventListener('mousemove',onMouseMove,false);
	addEventListener('mousedown',onMouseDown,false);
	addEventListener('keyup',onKey,false);
	addEventListener('keydown',onKey,false);
	addEventListener('contextmenu',onContextMenu,false);
	addEventListener('resize',onWindowResize,false);
}