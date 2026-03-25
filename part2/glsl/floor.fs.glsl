in vec3 vcsNormal;
in vec3 vcsPosition;
in vec2 texCoord;
in vec4 lightSpaceCoords;

uniform vec3 lightColor;
uniform vec3 ambientColor;

uniform float kAmbient;
uniform float kDiffuse;
uniform float kSpecular;
uniform float shininess;

uniform vec3 cameraPos;
uniform vec3 lightPosition;
uniform vec3 lightDirection;

// Textures are passed in as uniforms
uniform sampler2D colorMap;
uniform sampler2D normalMap;

// Added ShadowMap
uniform sampler2D shadowMap;
uniform float textureSize;

//Q1d do the shadow mapping
//Q1d iii do PCF
// Returns 1 if point is occluded (saved depth value is smaller than fragment's depth value)
float inShadow(vec3 fragCoord, vec2 offset) {
	//! =============================== d ===============================
	// fragCoord.xy is expected in [0, 1] shadow-map texture space
	vec2 uv = fragCoord.xy + offset;

	// Outside the shadow map: don't count it as occluded.
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
	
	// Sample closest depth from the shadow map.
	// DepthTexture is sampled as a float in [0, 1] (stored in .r).
	float closestDepth = texture(shadowMap, uv).r;

	// Small bias to reduce shadow acne.
	float bias = 0.005; //! avoid shadow acne

	// If the stored depth is smaller than this fragment's depth -> fragment is behind something.
	// （ fragCoord.z）The depth of the current floor element from the light source's perspective ("how far it is from the light")
	// (closestDepth) The shadow map stores the nearest surface depth ("how far away is the first thing blocking the light along this ray direction").
	return (closestDepth < fragCoord.z - bias) ? 1.0 : 0.0;
	//! =============================== d ===============================
}

// TODO: Returns a value in [0, 1], 1 indicating all sample points are occluded
float calculateShadow() {
	//! =============================== d ===============================
	// Project fragment from light clip space to [0, 1] texture space.
	vec3 projCoords = lightSpaceCoords.xyz / lightSpaceCoords.w; //! Map to [-1,1]
	projCoords = projCoords * 0.5 + 0.5; //! Map to [0,1]

	// Outside the light's depth range: not shadowed.
	if (projCoords.z < 0.0 || projCoords.z > 1.0) return 0.0;
	
	// 3x3 PCF kernel.
	// textureSize is expected to be 1.0 / shadowMapResolution (a single step in UV).
	float step = textureSize;

	// float occlusion = 0.0;
	// occlusion += inShadow(projCoords, vec2(-1.0, -1.0) * step);
	// occlusion += inShadow(projCoords, vec2( 0.0, -1.0) * step);
	// occlusion += inShadow(projCoords, vec2( 1.0, -1.0) * step);
	// occlusion += inShadow(projCoords, vec2(-1.0,  0.0) * step);
	// occlusion += inShadow(projCoords, vec2( 0.0,  0.0) * step);
	// occlusion += inShadow(projCoords, vec2( 1.0,  0.0) * step);
	// occlusion += inShadow(projCoords, vec2(-1.0,  1.0) * step);
	// occlusion += inShadow(projCoords, vec2( 0.0,  1.0) * step);
	// occlusion += inShadow(projCoords, vec2( 1.0,  1.0) * step);
	float occlusion = 0.0;
	for (int i = -1; i <= 1; i++) {
		for (int j = -1; j <= 1; j++) {
			occlusion += inShadow(projCoords, vec2(i, j) * step);
		}
	}
	//How many fractions of the sample are in the shadow around this pixel?

	// occlusion in [0, 1], where 1 means fully in shadow.
	return occlusion / 9.0;
	 //! =============================== d ===============================
}

void main() {
	//PRE-CALCS
	vec3 N = normalize(vcsNormal);
	vec3 Nt = normalize(texture(normalMap, texCoord).xyz * 2.0 - 1.0);
	vec3 L = normalize(vec3(viewMatrix * vec4(lightDirection, 0.0)));
	vec3 V = normalize(-vcsPosition);
	vec3 H = normalize(V + L);

	//AMBIENT
	vec3 light_AMB = ambientColor * kAmbient;

	//DIFFUSE
	vec3 diffuse = kDiffuse * lightColor;
	vec3 light_DFF = diffuse * max(0.0, dot(N, L));

	//SPECULAR
	vec3 specular = kSpecular * lightColor;
	vec3 light_SPC = specular * pow(max(0.0, dot(H, N)), shininess);

	//SHADOW
	// TODO:
	//! =============================== d ===============================
	float shadowOcclusion = calculateShadow();
	//! =============================== d ===============================
	//TOTAL
	light_DFF *= texture(colorMap, texCoord).xyz;

	//! =============================== d ===============================
	// shadowOcclusion=1 means fully shadowed -> only ambient contributes.
	vec3 TOTAL = light_AMB + (1.0 - shadowOcclusion) * (light_DFF + light_SPC);
	//! =============================== d ===============================

	gl_FragColor = vec4(TOTAL, 1.0);
}