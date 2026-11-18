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
  const covariance = scene.covariance && decode(scene.covariance, Float32Array);
  const density = scene.density && decode(scene.density, Float32Array);
  const water = decode(scene.water, Uint8Array);
  const vertex = `
    attribute vec3 position; attribute vec3 color;
    attribute vec3 covA; attribute vec3 covB; attribute float density; attribute float water;
    uniform mat4 camera; uniform vec3 cameraRight; uniform vec3 cameraUp;
    uniform float viewportHeight; uniform float maxPointSize; uniform float mirrorMode; uniform float waterY;
    varying vec3 vColor; varying vec3 vInverse; varying float vPointSize; varying float vDensity; varying float vWater;
    float covarianceAlong(vec3 a, vec3 b) {
      vec3 ca = mirrorMode > 0.5 ? vec3(a.x, -a.y, a.z) : a;
      vec3 cb = mirrorMode > 0.5 ? vec3(b.x, -b.y, b.z) : b;
      return ca.x * cb.x * covA.x + (ca.x * cb.y + ca.y * cb.x) * covA.y
        + (ca.x * cb.z + ca.z * cb.x) * covA.z + ca.y * cb.y * covB.x
        + (ca.y * cb.z + ca.z * cb.y) * covB.y + ca.z * cb.z * covB.z;
    }
    void main() {
      if (mirrorMode > 0.5 && position.y <= waterY + 0.03) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        gl_PointSize = 1.0;
        return;
      }
      vec3 point = position;
      if (mirrorMode > 0.5) point.y = 2.0 * waterY - point.y;
      vec4 p = camera * vec4(point, 1.0);
      gl_Position = p;
      float scale = viewportHeight * 0.5 * ${1 / Math.tan(Math.PI / 7)} / max(0.4, p.w);
      float a = max(0.0001, covarianceAlong(cameraRight, cameraRight) * scale * scale);
      float b = covarianceAlong(cameraRight, cameraUp) * scale * scale;
      float c = max(0.0001, covarianceAlong(cameraUp, cameraUp) * scale * scale);
      float eigen = 0.5 * (a + c + sqrt((a - c) * (a - c) + 4.0 * b * b));
      gl_PointSize = clamp(5.2 * sqrt(eigen), 2.0, maxPointSize);
      float determinant = max(0.000001, a * c - b * b);
      vInverse = vec3(c, -b, a) / determinant;
      vPointSize = gl_PointSize;
      vColor = color / 255.0;
      vDensity = density;
      vWater = water;
    }
  `;
  const fragment = `
    precision highp float; varying vec3 vColor; varying vec3 vInverse; varying float vPointSize; varying float vDensity; varying float vWater;
    uniform sampler2D reflectionMap; uniform vec2 viewportSize;
    void main() {
      vec2 q = (gl_PointCoord - 0.5) * vPointSize;
      q.y = -q.y;
      float distanceSquared = q.x * q.x * vInverse.x + 2.0 * q.x * q.y * vInverse.y + q.y * q.y * vInverse.z;
      if (vDensity < 1.0) {
        if (distanceSquared > 9.0) discard;
        vec3 shade = vColor;
        if (vWater > 0.5) {
          vec2 uv = gl_FragCoord.xy / viewportSize;
          uv += vec2(sin(gl_FragCoord.y * 0.07), sin(gl_FragCoord.x * 0.09)) * 0.0015;
          vec4 reflected = texture2D(reflectionMap, uv);
          shade = mix(shade, reflected.rgb, reflected.a * 0.7);
        }
        gl_FragColor = vec4(shade, vDensity * exp(-0.5 * distanceSquared));
      } else {
        if (distanceSquared > 6.25 + clamp(vDensity - 3.0, -1.0, 2.0) * 0.4) discard;
        gl_FragColor = vec4(vColor, 1.0);
      }
    }
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
  bind('position', positions, 3, gl.FLOAT); bind('color', colors, 3, gl.UNSIGNED_BYTE);
  bind('water', water, 1, gl.UNSIGNED_BYTE);
  if (covariance && density) {
    const first = new Float32Array(scene.count * 3);
    const second = new Float32Array(scene.count * 3);
    for (let i = 0; i < scene.count; i++) {
      first.set(covariance.subarray(i * 6, i * 6 + 3), i * 3);
      second.set(covariance.subarray(i * 6 + 3, i * 6 + 6), i * 3);
    }
    bind('covA', first, 3, gl.FLOAT);
    bind('covB', second, 3, gl.FLOAT);
    bind('density', density, 1, gl.FLOAT);
  }
  const matrixLocation = gl.getUniformLocation(program, 'camera');
  const rightLocation = gl.getUniformLocation(program, 'cameraRight');
  const upLocation = gl.getUniformLocation(program, 'cameraUp');
  const heightLocation = gl.getUniformLocation(program, 'viewportHeight');
  const maxPointLocation = gl.getUniformLocation(program, 'maxPointSize');
  const mirrorLocation = gl.getUniformLocation(program, 'mirrorMode');
  const waterYLocation = gl.getUniformLocation(program, 'waterY');
  const viewportSizeLocation = gl.getUniformLocation(program, 'viewportSize');
  const reflectionLocation = gl.getUniformLocation(program, 'reflectionMap');
  const maxPointSize = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1];
  const initial = { yaw: scene.yaw ?? 0.08, pitch: scene.pitch ?? 0.18, distance: scene.distance, target: [...scene.target] };
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
  const reflectionTexture = gl.createTexture();
  const reflectionDepth = gl.createRenderbuffer();
  const reflectionFrame = gl.createFramebuffer();
  let reflectionWidth = 0, reflectionHeight = 0, reflectionReady = false;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, reflectionTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(reflectionLocation, 0);
  const resizeReflection = (width, height) => {
    if (width === reflectionWidth && height === reflectionHeight) return;
    reflectionWidth = width;
    reflectionHeight = height;
    gl.bindTexture(gl.TEXTURE_2D, reflectionTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, reflectionDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFrame);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, reflectionTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, reflectionDepth);
    reflectionReady = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  };
  let renderQueued = false;
  let drag = null;
  let zooming = false;
  let wheelRestoreTimer = null;
  const scheduleRender = () => {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(render);
  };
  const render = () => {
    renderQueued = false;
    const fullRatio = Math.min(devicePixelRatio || 1, 2);
    const ratio = drag || zooming ? Math.max(0.75, fullRatio * 0.6) : fullRatio;
    const width = Math.round(innerWidth * ratio), height = Math.round(innerHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    resizeReflection(width, height);
    gl.viewport(0, 0, width, height);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.uniformMatrix4fv(matrixLocation, false, cameraMatrix());
    const cy = Math.cos(state.yaw), sy = Math.sin(state.yaw), cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
    gl.uniform3f(rightLocation, cy, 0, -sy);
    gl.uniform3f(upLocation, -sp * sy, cp, -sp * cy);
    gl.uniform1f(heightLocation, height);
    gl.uniform1f(maxPointLocation, maxPointSize);
    gl.uniform1f(waterYLocation, scene.pond.waterY);
    gl.uniform2f(viewportSizeLocation, width, height);
    if (reflectionReady) {
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFrame);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(mirrorLocation, 1);
      gl.drawArrays(gl.POINTS, 0, scene.transparentStart);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, reflectionReady ? reflectionTexture : null);
    gl.clearColor(.045, .105, .125, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(mirrorLocation, 0);
    gl.drawArrays(gl.POINTS, 0, scene.transparentStart);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.drawArrays(gl.POINTS, scene.transparentStart, scene.count - scene.transparentStart);
    gl.depthMask(true);
  };
  canvas.addEventListener('pointerdown', event => { drag = { x: event.clientX, y: event.clientY, button: event.button }; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', event => { if (!drag) return; const dx = event.clientX - drag.x, dy = event.clientY - drag.y; drag.x = event.clientX; drag.y = event.clientY; if (drag.button === 2) { state.target[0] -= dx * state.distance / 950; state.target[1] += dy * state.distance / 950; } else { state.yaw -= dx * .008; state.pitch = Math.max(-1.35, Math.min(1.35, state.pitch + dy * .008)); } if (dx || dy) scheduleRender(); });
  const stopDragging = () => { if (drag) { drag = null; scheduleRender(); } };
  canvas.addEventListener('pointerup', stopDragging);
  canvas.addEventListener('pointercancel', stopDragging);
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    state.distance = Math.max(4, Math.min(35, state.distance * Math.exp(event.deltaY * .001)));
    zooming = true;
    clearTimeout(wheelRestoreTimer);
    wheelRestoreTimer = setTimeout(() => { zooming = false; scheduleRender(); }, 180);
    scheduleRender();
  }, { passive: false });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  window.addEventListener('resize', scheduleRender);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleRender(); });
  document.querySelector('#reset').onclick = () => { Object.assign(state, initial, { target: [...initial.target] }); scheduleRender(); };
  document.querySelector('#front').onclick = () => { state.yaw = 0; state.pitch = .08; state.target = [...initial.target]; state.distance = initial.distance; scheduleRender(); };
  document.querySelector('#top').onclick = () => { state.yaw = .1; state.pitch = 1.22; state.target = [0, 1.5, 0]; state.distance = 18; scheduleRender(); };
  status.textContent = `${scene.count.toLocaleString('pt-BR')} partículas 3D · cena local`;
  scheduleRender();
})();
