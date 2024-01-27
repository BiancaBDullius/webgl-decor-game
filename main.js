import {
	objs,
	mtlPath,
	objPath,
	texturePath,
	vertexShaderText,
	fragmentShaderText,
	fs,
	makeIndexedIndicesFn,
	parseMTL,
	parseMapArgs,
	parseOBJ,
	vs,
	loadFileContent,
	getExtents,
	getGeometriesExtents,
	degToRad
} from './utils.js';

let objOnSceneIdCount = 0;

let objsOnScene = [];

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
		}

		const gl = objs[i]['canvas'].getContext("webgl2");
		if (!gl) {
			return;
		}

		twgl.setAttributePrefix("a_");

		const meshProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
		const objText = await loadFileContent(`${objPath}/${objs[i].fileOBJ}`);
		const obj = parseOBJ(objText);
		const mtlText = await loadFileContent(`${mtlPath}/${objs[i].fileMTL}`);
		const materials = parseMTL(mtlText);

		const textures = {
			defaultWhite: twgl.createTexture(gl, { src: [255, 255, 255, 255] }),
		};

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

		const extents = getGeometriesExtents(obj.geometries);
		const range = m4.subtractVectors(extents.max, extents.min);

		const objOffset = m4.scaleVector(
			m4.addVectors(
				extents.min,
				m4.scaleVector(range, 0.5)),
			-1);
		const cameraTarget = [0, 0, 0];

		const radius = m4.length(range) * 1.2;
		const cameraPosition = m4.addVectors(cameraTarget, [
			0,
			0,
			radius,
		]);

		const zNear = radius / 100;
		const zFar = radius * 3;

		function render(time) {
			time *= 0.001;

			twgl.resizeCanvasToDisplaySize(gl.canvas);
			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
			gl.enable(gl.DEPTH_TEST);

			const fieldOfViewRadians = degToRad(60);
			const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
			const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

			const up = [0, 1, 0];
			const camera = m4.lookAt(cameraPosition, cameraTarget, up);

			const view = m4.inverse(camera);

			const sharedUniforms = {
				u_lightDirection: m4.normalize([-1, 3, 5]),
				u_view: view,
				u_projection: projection,
				u_viewWorldPosition: cameraPosition,
			};

			gl.useProgram(meshProgramInfo.program);

			twgl.setUniforms(meshProgramInfo, sharedUniforms);

			let u_world = m4.yRotation(time);
			u_world = m4.translate(u_world, ...objOffset);

			for (const { bufferInfo, vao, material } of parts) {
				gl.bindVertexArray(vao);

				twgl.setUniforms(meshProgramInfo, {
					u_world,
				}, material);

				twgl.drawBufferInfo(gl, bufferInfo);
			}

			requestAnimationFrame(render);
		}
		requestAnimationFrame(render);
	}
}

let removeObjOnScene = (id) => {
	objsOnScene = objsOnScene.filter(function (obj) {
		return obj.onSceneId !== id;
	});
	console.log(objsOnScene);
}

let addObjToMenu = (onSceneId, obj) => {
	var div = document.createElement('div');
	div.className = 'menu-scene-item';
	div.id = onSceneId;
	div.appendChild(document.createTextNode(obj.name));

	var icon = document.createElement('i');
	icon.id = 'menu-import';
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
	const canvas = document.getElementById("canvas-surface");
	const gl = canvas.getContext("webgl2");
	if (!gl) {
		return;
	}

	const rootStyles = getComputedStyle(document.documentElement);
	const corBackground = rootStyles.getPropertyValue('--cor-background');

	canvas.style.backgroundColor = corBackground;
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth * 0.6;

	//COMEÇA AQUI










	//TERMINA AQUI


}
main();
loadObjectsMenu();
