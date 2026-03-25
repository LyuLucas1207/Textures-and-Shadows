in vec3 vcsNormal;
in vec3 vcsPosition;
in vec3 worldPosition; //! Input the world position of environment map
in vec3 worldNormal; //! Input the world normal of environment map

uniform samplerCube skyboxCubemap; //! Using the uniform for the skybox cubemap from A4.js

void main() {
	//! =============================== c ===============================
	vec3 N = normalize(worldNormal); //! Normalize the world normal, only need direction
	// Incident direction (camera → surface); reflect() returns outgoing direction for cubemap lookup.
	vec3 I = normalize(worldPosition - cameraPosition);
	vec3 R = reflect(I, N);
	// CubeTextureLoader faces are ordered for three.js' right-handed scene; GLSL cube sampling uses
	// a left-handed lookup — flip X so reflections match scene.background.
	vec3 Rsample = vec3(-R.x, R.y, R.z);
	vec3 color = texture(skyboxCubemap, Rsample).rgb;
	gl_FragColor = vec4(color, 1.0);
	//! =============================== c ===============================
}
