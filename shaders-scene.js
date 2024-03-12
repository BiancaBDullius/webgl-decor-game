export const vs = `#version 300 es
    in vec4 a_position;
    in vec3 a_normal;
    in vec2 a_texcoord;
    in vec4 a_color;

    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform mat4 u_world;
    uniform vec3 u_viewWorldPosition;

    out vec3 v_normal;
    out vec3 v_surfaceToView;
    out vec2 v_texcoord;
    out vec4 v_color;

    void main() {
        vec4 worldPosition = u_world * a_position;
        gl_Position = u_projection * u_view * worldPosition;
        v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
        v_normal = mat3(u_world) * a_normal;
        v_texcoord = a_texcoord;
        v_color = a_color;
    }
`;
export const fs = `#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_surfaceToView;
in vec2 v_texcoord;
in vec4 v_color;

uniform vec3 diffuse;
uniform sampler2D diffuseMap;
uniform vec3 ambient; 
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess; 
uniform float opacity;
uniform vec3 u_ambientLight; // luz ambiente
uniform float lights;
uniform vec3 u_lightDirections[5]; // direção a luz

out vec4 outColor;

void main () {
    
  vec3 normal = normalize(v_normal);
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 totalLight = vec3(0.4);

  for (int i = 0; i < int(lights); i++) {
      vec3 halfVector = normalize(u_lightDirections[i] + surfaceToViewDirection);
      float fakeLight = dot(u_lightDirections[i], normal) * 0.4 + 0.4;
      float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0) ;
  
      totalLight += diffuse * fakeLight +
                    specular * pow(specularLight, shininess);
  }
  
  vec4 diffuseMapColor = texture(diffuseMap, v_texcoord);
  vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
  float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;
  

  outColor = vec4(
    emissive +
    ambient * u_ambientLight +
    effectiveDiffuse * totalLight,
    effectiveOpacity);
}
  `;

export const vsToon = `
attribute vec4 position;
attribute vec3 normal;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  gl_Position = u_projection * u_view * u_world * position;
  v_normal = mat3(u_world) * normal;
}
`;

export const fsToon = `
precision mediump float;

varying vec3 v_normal;

void main() {
  vec3 lightDirection = normalize(vec3(-1, -1, -1));
  float intensity = dot(normalize(v_normal), lightDirection);
  if (intensity > 0.95) {
    gl_FragColor = vec4(1, 1, 1, 1);
  } else if (intensity > 0.5) {
    gl_FragColor = vec4(0.8, 0.8, 0.8, 1);
  } else if (intensity > 0.25) {
    gl_FragColor = vec4(0.6, 0.6, 0.6, 1);
  } else {
    gl_FragColor = vec4(0.4, 0.4, 0.4, 1);
  }
}
`;