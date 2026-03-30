uniform mat4 lightProjMatrix;  //! Get the projection matrix for the light
uniform mat4 lightViewMatrix; //! Get the view matrix for the light

out vec3 vcsPosition;
out vec3 vcsNormal;
out vec2 texCoord;
out vec4 lightSpacePos; //! Output the light space position, will be used for fragment shader

void main() {
	//! =============================== a ===============================
	vcsNormal = normalMatrix * normal; //! Get the normal in the view space

	vcsPosition = vec3(modelViewMatrix * vec4(position, 1.0)); //! Get the position in the view space

	mat4 lightSpaceMatrix = lightProjMatrix * lightViewMatrix; //! Get the light space matrix （WorldSpace -> ViewSpace_light -> ProjectionSpace_light）
	lightSpacePos = lightSpaceMatrix * modelMatrix * vec4(position, 1.0); //! Get the light space position
	texCoord = uv; //! Get the texture coordinates of pixel_v4.glb

	//! =============================== a ===============================
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
