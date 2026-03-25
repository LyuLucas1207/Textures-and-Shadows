out vec3 vcsPosition;
out vec3 vcsNormal;
out vec2 texCoord;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
 }