//Q1d implement the whole thing to map the depth texture to a quad
// TODO:

uniform mat4 lightProjMatrix;
uniform mat4 lightViewMatrix;

//! =============================== d ===============================
out vec2 vUv; //! Output the texture coordinate
//! =============================== d ===============================

void main() {
    //! =============================== d ===============================
    vUv = uv;
    //! =============================== d ===============================
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );

}