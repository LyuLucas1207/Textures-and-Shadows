//Q1d implement the whole thing to map the depth texture to a quad
// TODO:

uniform sampler2D tDiffuse;
uniform sampler2D tDepth;

//! =============================== d ===============================
in vec2 vUv;
//! =============================== d ===============================

void main() {
    // Visualize depth in grayscale. DepthTexture is sampled from .r in [0, 1].
    //! =============================== d ===============================
    /*
    The `texture()` function in GLSL is used to retrieve values ​​from a texture: 
    taking a location (u, v) and retrieving the color/value of that pixel in the image.
    */
    float depth = texture(tDepth, vUv).x; //.x = .r 
    //! =============================== d ===============================
    gl_FragColor = vec4(vec3(depth, depth, depth), 1.0);
}