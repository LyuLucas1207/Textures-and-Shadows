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
	return 0.0;
}

// TODO: Returns a value in [0, 1], 1 indicating all sample points are occluded
float calculateShadow() {
	return 0.0;
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
	float shadow = 1.0;

	//TOTAL
	light_DFF *= texture(colorMap, texCoord).xyz;
	vec3 TOTAL = light_AMB + shadow * (light_DFF + light_SPC);

	gl_FragColor = vec4(TOTAL, 1.0);
}