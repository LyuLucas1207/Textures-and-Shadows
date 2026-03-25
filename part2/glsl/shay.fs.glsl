in vec3 vcsNormal;
in vec3 vcsPosition;
in vec2 texCoord; //! given by vertex shader, uv
in vec4 lightSpacePos;

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



void main() {
	//PRE-CALCS
	vec3 N = normalize(vcsNormal);
	vec2 uv = vec2(texCoord.x, 1.0 - texCoord.y); //! V flipped per assignment hint， The texture is flipped on the y-axis. [0, 1] --flip-> [0, 1] eg.0.5->0.5, 0.25->0.75, 0.75->0.25
	vec3 Nt = normalize(texture(normalMap, uv).xyz * 2.0 - 1.0);//! texture function returns RGBA, *2.0 - 1.0 to get the normal in the range of [-1, 1] from [0, 1]
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

	//TOTAL — Q1a: base color from texture (V flipped per assignment hint)
	vec3 albedo = texture(colorMap, uv).rgb; //! The base color of an object's surface (the "pigment color" without illumination)
	vec3 lighting = light_AMB + light_DFF + light_SPC;
	vec3 TOTAL = albedo * lighting;

	gl_FragColor = vec4(TOTAL, 1.0);
}