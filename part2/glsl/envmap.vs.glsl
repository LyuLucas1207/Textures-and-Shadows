out vec3 vcsNormal;
out vec3 vcsPosition;
out vec3 worldPosition; //! Output the world position of environment map
out vec3 worldNormal; //! Output the world normal of environment map

void main() {
	// viewing coordinate system
	vcsNormal = normalMatrix * normal; 
	vcsPosition = vec3(modelViewMatrix * vec4(position, 1.0));

	worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;  //! Get the world position of environment map
	worldNormal = mat3(modelMatrix) * normal;  //! Get the world normal of environment map

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
