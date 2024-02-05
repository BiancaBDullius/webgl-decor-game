import {
	objs,
	changeThemeMode, renderObj, vs, fs, loadFileContent, objPath, mtlPath, parseOBJ, parseMTL, texturePath, getGeometriesExtents, getExtents, degToRad
} from './utils.js';

let themeMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
let objsOnScene = [];
let objOnSceneIdCount = 0;
let selectedObjOnScene = null;
const canvas = document.getElementById("canvas-surface");
const glScene = canvas.getContext("webgl2");
twgl.setAttributePrefix("a_");
let meshProgramInfo = twgl.createProgramInfo(glScene, [vs, fs]);
const textures = {
	defaultWhite: twgl.createTexture(glScene, { src: [255, 255, 255, 255] }),
};

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
			addObjToMenu(objOnSceneIdCount, objs[i]);
			renderSceneObjs(glScene)
		}

		const gl = objs[i]['canvas'].getContext("webgl2");
		if (!gl) {
			return;
		}

		renderObj(gl, objs[i])
	}
}

let removeObjOnScene = (id) => {
	objsOnScene = objsOnScene.filter(function (obj) {
		if (obj.onSceneId != id) return obj;
	});
	console.log(objsOnScene)
}

let addObjToMenu = (onSceneId, obj) => {
	var div = document.createElement('div');
	div.className = 'menu-scene-item';
	div.id = `menu-scene-item ${onSceneId}`;
	div.appendChild(document.createTextNode(obj.name));

	div.onclick = () => {
		handleSelectedObjOnScene(onSceneId);
	}

	var icon = document.createElement('i');
	icon.id = onSceneId;
	icon.className = 'fa fa-trash icons';
	icon.style.fontSize = '24px';
	icon.onclick = () => {
		selectedObjOnScene = null;
		div.remove();
		removeObjOnScene(onSceneId);
	}

	div.appendChild(icon);

	var onSceneItensDiv = document.getElementById('onSceneItens');
	onSceneItensDiv.appendChild(div);
}

let handleSelectedObjOnScene = (onSceneId) => {
	if (selectedObjOnScene) {
		let previousSelected = document.getElementById(`menu-scene-item ${selectedObjOnScene}`)
		previousSelected.style.opacity = 0.5;
	}
	let div = document.getElementById(`menu-scene-item ${onSceneId}`);
	if (div) {
		div.style.opacity = 1;
		selectedObjOnScene = onSceneId;
	}

	let index;
	objsOnScene.map((object, i) => {
		if (object.onSceneId == selectedObjOnScene) index = i;
	})
	if (index) {
		let inputSize = document.getElementById('input-size');
		let inputRotationY = document.getElementById('input-rotation-y');
		inputSize.value = objsOnScene[index].values.size;
		inputRotationY.value = objsOnScene[index].values.rotationy;
	}

}

async function renderSceneObjs(gl) {
	for (let i = 0; i < objsOnScene.length; i++) {
		if (objsOnScene[i] && objsOnScene[i].values.changed) {
			objsOnScene[i].values.changed = false;
			console.log("teve mudança")

			const objText = await loadFileContent(`${objPath}/${objsOnScene[i].fileOBJ}`);
			const obj = parseOBJ(objText);
			const mtlText = await loadFileContent(`${mtlPath}/${objsOnScene[i].fileMTL}`);
			const materials = parseMTL(mtlText);



			for (const material of Object.values(materials)) {
				Object.entries(material)
					.filter(([key]) => key.endsWith('Map'))
					.forEach(([key]) => {
						const texture = twgl.createTexture(gl, { src: texturePath, flipY: true });
						material[key] = texture;
					});
			}

			Object.values(materials).forEach(m => {
				m.shininess = 25;
				m.specular = [3, 2, 1];
			});

			const defaultMaterial = {
				diffuse: [1, 1, 1],
				diffuseMap: textures.defaultWhite,
				ambient: [0, 0, 0],
				specular: [1, 1, 1],
				specularMap: textures.defaultWhite,
				shininess: 400,
				opacity: 1,
			};

			const parts = obj.geometries.map(({ material, data }) => {
				if (data.color) {
					if (data.position.length === data.color.length) {
						data.color = { numComponents: 3, data: data.color };
					}
				} else {
					data.color = { value: [1, 1, 1, 1] };
				}

				const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
				const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);


				return {
					material: {
						...defaultMaterial,
						...materials[material],
					},
					bufferInfo,
					vao,
				};
			});

			objsOnScene[i].parts = parts;

			const extents = getGeometriesExtents(obj.geometries);
			const range = m4.subtractVectors(extents.max, extents.min);
			const objOffset = m4.scaleVector(
				m4.addVectors(
					extents.min,
					m4.scaleVector(range, objsOnScene[i].values.size)),
				-1);
			const cameraTarget = [0, 0, 0];
			const radius = m4.length(range) * objsOnScene[i].values.size;
			const cameraPosition = m4.addVectors(cameraTarget, [
				0,
				0,
				radius,
			]);
			objsOnScene[i].values.objOffset = objOffset;
			objsOnScene[i].values.cameraTarget = cameraTarget;
			objsOnScene[i].values.radius = radius;
			objsOnScene[i].values.cameraPosition = cameraPosition;
		}

	}
}

async function render() {
	if (objsOnScene.length != 0) {
		for (const objOnScene of objsOnScene) {
			if (objOnScene.values.cameraPosition && objOnScene.parts) {

				const zNear = objOnScene.values.radius / 100;
				const zFar = objOnScene.values.radius * 3;
				twgl.resizeCanvasToDisplaySize(glScene.canvas);
				glScene.viewport(0, 0, glScene.canvas.width, glScene.canvas.height);
				glScene.enable(glScene.DEPTH_TEST);

				const fieldOfViewRadians = degToRad(60);
				const aspect = glScene.canvas.clientWidth / glScene.canvas.clientHeight;
				const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

				const up = [0, 1, 0];
				const camera = m4.lookAt(objOnScene.values.cameraPosition, objOnScene.values.cameraTarget, up);

				const view = m4.inverse(camera);

				const sharedUniforms = {
					u_lightDirection: m4.normalize([-1, 3, 5]),
					u_view: view,
					u_projection: projection,
					u_viewWorldPosition: objOnScene.values.cameraPosition,
				};

				glScene.useProgram(meshProgramInfo.program);

				twgl.setUniforms(meshProgramInfo, sharedUniforms);


				let u_world = m4.yRotation(objOnScene.values.rotationy);
				u_world = m4.translate(u_world, ...objOnScene.values.objOffset);

				for (const { bufferInfo, vao, material } of objOnScene.parts) {
					glScene.bindVertexArray(vao);

					twgl.setUniforms(meshProgramInfo, {
						u_world,
					}, material);

					twgl.drawBufferInfo(glScene, bufferInfo);
				}
			}
		}
		requestAnimationFrame(render)
	} else {
		requestAnimationFrame(render)
	}
}

const main = async () => {
	render();
	const theme = document.getElementById('theme');

	theme.onclick = () => {
		themeMode = changeThemeMode(themeMode);
	};
	loadObjectsMenu();

	let inputSize = document.getElementById('input-size');
	let inputRotationY = document.getElementById('input-rotation-y');

	inputSize.onchange = () => {
		if (selectedObjOnScene) {
			let index = null;
			objsOnScene.map((obj, i) => {
				if (obj.onSceneId == selectedObjOnScene) index = i;
			})
			objsOnScene[index].values.size = inputSize.value;
			objsOnScene[index].values.changed = true;
		}
		renderSceneObjs(glScene)
	}

	inputRotationY.onchange = () => {
		if (selectedObjOnScene) {
			let index = null;
			objsOnScene.map((obj, i) => {
				if (obj.onSceneId == selectedObjOnScene) index = i;
			})
			objsOnScene[index].values.rotationy = inputRotationY.value;
			objsOnScene[index].values.changed = true;
		}
		renderSceneObjs(glScene)
	}
}

main();

