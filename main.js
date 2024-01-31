import {
	objs,
	changeThemeMode, renderObj, renderSceneObjs
} from './utils.js';

let themeMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
let objsOnScene = [];
let objOnSceneIdCount = 0;
const canvas = document.getElementById("canvas-surface");
const glScene = canvas.getContext("webgl2");

let loadObjectsMenu = async () => {
	for (let i = 0; i < objs.length; i++) {
		objs[i]['canvas'] = document.createElement('canvas');
		objs[i]['canvas'].id = objs[i]['id'];
		objs[i]['canvas'].className = 'canvas-element-list-box';


		document.body.appendChild(objs[i]['canvas']);
		document.getElementById('canvas-objects-list').appendChild(objs[i]['canvas']);

		objs[i]['canvas'].onclick = () => {
			console.log(objs[i]['id'] + ' obj clicado')
			objOnSceneIdCount++;
			objsOnScene.push({ onSceneId: objOnSceneIdCount, ...objs[i] });

			if (!glScene) {
				return;
			}

			for (let z = 0; z < objsOnScene.length; z++) {
				renderSceneObjs(glScene, objsOnScene[z], objsOnScene[z].objOnSceneIdCount);
			}

			addObjToMenu(objOnSceneIdCount, objs[i]);
		}

		const gl = objs[i]['canvas'].getContext("webgl2");
		if (!gl) {
			return;
		}

		renderObj(gl, objs[i])
	}
}

let removeObjOnScene = (id) => {
	console.log(objsOnScene)
	console.log("chega aqui")
	objsOnScene = objsOnScene.filter(function (obj) {
		return obj.onSceneId !== id;
	});
	for (let z = 0; z < objsOnScene.length; z++) {
		renderSceneObjs(glScene, objsOnScene[z], objsOnScene[z].objOnSceneIdCount);
	}
}

let addObjToMenu = (onSceneId, obj) => {
	var div = document.createElement('div');
	div.className = 'menu-scene-item';
	div.id = `menu-scene-item ${onSceneId}`;
	div.appendChild(document.createTextNode(obj.name));

	var icon = document.createElement('i');
	icon.id = onSceneId;
	icon.className = 'fa fa-trash icons';
	icon.style.fontSize = '24px';
	icon.onclick = () => {
		div.remove();
		removeObjOnScene(onSceneId);
	}

	div.appendChild(icon);

	var onSceneItensDiv = document.getElementById('onSceneItens');
	onSceneItensDiv.appendChild(div);
}

const main = async () => {
	const theme = document.getElementById('theme');

	theme.onclick = () => {
		themeMode = changeThemeMode(themeMode);
	};
	console.log(objsOnScene)
	loadObjectsMenu();

	//COMEÇA AQUI



	//TERMINA AQUI


}

main();

