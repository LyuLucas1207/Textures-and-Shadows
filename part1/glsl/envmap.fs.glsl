in vec3 vcsNormal;
in vec3 vcsPosition;

uniform samplerCube skybox;

uniform mat4 matrixWorld;

void main( void ) {

  // Q1c : Calculate the vector that can be used to sample from the cubemap
  // TODO: Keep in mind texture() samples in a left-handed coordinate system!
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}