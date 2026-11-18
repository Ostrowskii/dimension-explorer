(() => {
  const canvas = document.querySelector('#world');
  const status = document.querySelector('#status');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  if (!gl || !window.TOWER_SCENE) {
    status.textContent = 'Não foi possível iniciar o WebGL ou carregar a cena.';
    return;
  }
  const scene = window.TOWER_SCENE;
  const decode = (base64, Type) => {
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    return new Type(bytes.buffer);
  };
  const positions = decode(scene.positions, Float32Array);
  const colors = decode(scene.colors, Uint8Array);
  const sizes = decode(scene.sizes, Float32Array);
  const vertex = `
    attribute vec3 position; attribute vec3 color; attribute float size;
    uniform mat4 camera; uniform float pixelRatio; varying vec3 vColor;
    void main() { vec4 p = camera * vec4(position, 1.0); gl_Position = p; gl_PointSize = clamp(size * 72.0 * pixelRatio / max(0.4, p.w), 2.0, 18.0); vColor = color / 255.0; }
  `;
  const fragment = `
    precision mediump float; varying vec3 vColor;
    void main() { vec2 p = gl_PointCoord * 2.0 - 1.0; float edge = smoothstep(1.0, 0.7, dot(p, p)); gl_FragColor = vec4(vColor, edge); }
  `;
  const compile = (type, source) => { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); return shader; };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  gl.useProgram(program);
  const bind = (name, data, size, type) => {
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, name); gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, size, type, false, 0, 0);
  };
  bind('position', positions, 3, gl.FLOAT); bind('color', colors, 3, gl.UNSIGNED_BYTE); bind('size', sizes, 1, gl.FLOAT);
  const matrixLocation = gl.getUniformLocation(program, 'camera');
  const pixelRatioLocation = gl.getUniformLocation(program, 'pixelRatio');
  const initial = { yaw: 0.08, pitch: 0.18, distance: scene.distance, target: [...scene.target] };
  const state = { ...initial, target: [...initial.target] };
  const normalize = vector => { const length = Math.hypot(...vector) || 1; return vector.map(value => value / length); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cameraMatrix = () => {
    const aspect = canvas.width / canvas.height, near = .1, far = 80, f = 1 / Math.tan(Math.PI / 7);
    const eye = [state.target[0] + state.distance * Math.cos(state.pitch) * Math.sin(state.yaw), state.target[1] + state.distance * Math.sin(state.pitch), state.target[2] + state.distance * Math.cos(state.pitch) * Math.cos(state.yaw)];
    const z = normalize(eye.map((value, index) => value - state.target[index]));
    const x = normalize(cross([0, 1, 0], z)); const y = cross(z, x);
    const view = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
    const projection = [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0];
    const out = new Float32Array(16);
    for (let column = 0; column < 4; column++) for (let row = 0; row < 4; row++) for (let k = 0; k < 4; k++) out[column * 4 + row] += projection[k * 4 + row] * view[column * 4 + k];
    return out;
  };
  const render = () => { const ratio = Math.min(devicePixelRatio || 1, 2); const width = innerWidth * ratio, height = innerHeight * ratio; if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; } gl.viewport(0, 0, width, height); gl.clearColor(.045, .105, .125, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.uniformMatrix4fv(matrixLocation, false, cameraMatrix()); gl.uniform1f(pixelRatioLocation, ratio); gl.drawArrays(gl.POINTS, 0, scene.count); requestAnimationFrame(render); };
  let drag = null;
  canvas.addEventListener('pointerdown', event => { drag = { x: event.clientX, y: event.clientY, button: event.button }; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', event => { if (!drag) return; const dx = event.clientX - drag.x, dy = event.clientY - drag.y; drag.x = event.clientX; drag.y = event.clientY; if (drag.button === 2) { state.target[0] -= dx * state.distance / 950; state.target[1] += dy * state.distance / 950; } else { state.yaw -= dx * .008; state.pitch = Math.max(-1.35, Math.min(1.35, state.pitch - dy * .008)); } });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', event => { event.preventDefault(); state.distance = Math.max(4, Math.min(35, state.distance * Math.exp(event.deltaY * .001))); }, { passive: false });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  document.querySelector('#reset').onclick = () => Object.assign(state, initial, { target: [...initial.target] });
  document.querySelector('#front').onclick = () => { state.yaw = 0; state.pitch = .08; state.target = [...initial.target]; state.distance = initial.distance; };
  document.querySelector('#top').onclick = () => { state.yaw = .1; state.pitch = 1.22; state.target = [0, 1.5, 0]; state.distance = 18; };
  status.textContent = `${scene.count.toLocaleString('pt-BR')} partículas 3D · cena local`;
  render();
})();
