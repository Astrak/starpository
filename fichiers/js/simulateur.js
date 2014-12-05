onload=function(){
	var init=function(){
		var scene=new THREE.Scene(),ship,
			wrapper=new THREE.Object3D(),
			renderer=new THREE.WebGLRenderer(),
			camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,9,1000),
			controls=new THREE.SimulatorControls(renderer,ship,camera),
			pL=new THREE.PointLight(0xffffff,4,100),
			mat=new THREE.MeshLambertMaterial({color:0xff0000}),
			box=new THREE.Mesh(new THREE.BoxGeometry(10,10,10),mat),
			JSON=new THREE.JSONLoader(),
			box2=new THREE.Mesh(new THREE.BoxGeometry(5,5,5),new THREE.MeshLambertMaterial({color:0x00ff00}));
		JSON.load('js/JSON/TIE.js',function(geometry){
			ship=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:0xffffff}));
			scene.add(ship)});
		pL.position.set(10,20,0);
		box.position.z=-10;
		box2.position.x=-20;
		camera.position.z=10;
		scene.add(camera,wrapper);
		wrapper.add(box,box2,pL);
		function render(){
			controls.update(ship,wrapper);
			requestAnimationFrame(render);
			renderer.render(scene,camera);
		}
		render();
		renderer.setSize(innerWidth,innerHeight);
		document.body.appendChild(renderer.domElement);
	};
	var button=document.createElement('button');
	button.innerHTML='INIT';
	document.body.appendChild(button);
	button.addEventListener('mousedown',init,false);
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