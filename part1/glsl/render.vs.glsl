//Q1d implement the whole thing to map the depth texture to a quad
// TODO:

uniform mat4 lightProjMatrix;
uniform mat4 lightViewMatrix;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );

}