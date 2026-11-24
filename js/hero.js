/* =========================================================
   HERO DÍA / NOCHE CON NIEBLA
   Adaptado del motor de Lumen Roof: un único reloj
   (requestAnimationFrame) calcula el hundimiento, la oleada de
   niebla y la mezcla de colores, y los escribe en variables CSS
   y en los uniforms del shader WebGL2. El cambio de foto ocurre
   en el punto más profundo, cuando la niebla lo cubre todo.
   ========================================================= */
(() => {
  const root = document.documentElement.style;
  const $ = id => document.getElementById(id);
  const hero = $('inicio');
  if (!hero) return;

  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  const SINK = 240, RISE = 820, DEPTH = .27;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };

  // Estado inicial según la hora local: de 6:00 a 18:59 es de día
  const h = new Date().getHours();
  const startNight = (h >= 19 || h < 6) ? 1 : 0;
  let target = startNight, from = startNight, start = -1e9, queued = null, swapped = true, k = startNight;
  let animating = false, clock = 0;

  /* ---------- Niebla WebGL2 ---------- */
  const cv = $('fog');
  const gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
  const U = {};
  if (gl) {
    const vs = `#version 300 es
    void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}`;
    const fs = `#version 300 es
    precision highp float;
    uniform vec2 R;uniform float T,S,K;out vec4 O;
    float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float a=.5,s=0.;mat2 m=mat2(1.6,1.2,-1.2,1.6);p=mat2(.8,.6,-.6,.8)*p+5.3;for(int i=0;i<5;i++){s+=a*n(p);p=m*p;a*=.5;}return s;}
    void main(){
      vec2 uv=gl_FragCoord.xy/R;uv.y=1.-uv.y;
      float asp=R.x/R.y;vec2 p=vec2(uv.x*asp,uv.y);
      float t=T*.05;
      vec2 w=vec2(fbm(p*1.3+vec2(t,-t*.6)),fbm(p*1.3+vec2(-t*.8,t)+7.));
      float d=fbm(p*1.9+w*1.7+vec2(t*1.6,-t*1.1+S*.5));
      float e=fbm(p*.9-w+vec2(-t,t*.5)+3.);
      float low=smoothstep(.72,1.04,uv.y+(d-.5)*.34);
      float side=(1.-smoothstep(0.,.2,uv.x+(e-.5)*.28))+smoothstep(.8,1.,uv.x+(e-.5)*.28);
      side*=smoothstep(.25,.6,uv.y)*.18;
      float wisps=smoothstep(.5,.78,d)*smoothstep(.22,.5,uv.y)*(1.-smoothstep(.6,.86,uv.y))*.14;
      float rest=clamp(low+side+wisps,0.,1.);
      float front=1.02-S*.68;
      float rise=smoothstep(front-.02,front+.26,uv.y+(d-.5)*.5);
      float haze=S*(.3+.46*d);
      float a=clamp(max(rest,max(rise*.97,haze)),0.,1.);
      /* Día: crema cálida · Noche: azul marino profundo */
      vec3 dayA=vec3(.98,.95,.88),dayB=vec3(.84,.81,.74);
      vec3 nitA=vec3(.30,.36,.50),nitB=vec3(.07,.11,.21);
      vec3 c=mix(mix(dayB,dayA,d*1.15),mix(nitB,nitA,d*1.1),K);
      /* Resplandor dorado del lobby iluminado por la noche */
      vec2 q=(uv-vec2(.5,.66))*vec2(1.5,2.8);
      float lobby=exp(-dot(q,q)*3.);
      c=mix(c,vec3(.90,.70,.36),K*lobby*.45*(1.-S));
      O=vec4(c*a,a);
    }`;
    const sh = (t, s) => {
      const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o));
      return o;
    };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr); gl.useProgram(pr);
    for (const u of ['R', 'T', 'S', 'K']) U[u] = gl.getUniformLocation(pr, u);
  }
  // Se renderiza como máximo a 960 px de ancho y el CSS lo escala: niebla suave y barata
  function size() {
    if (!gl) return;
    const w = Math.round(Math.min(innerWidth, 960)), hh = Math.round(w * hero.clientHeight / innerWidth);
    if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; gl.viewport(0, 0, w, hh); }
  }
  addEventListener('resize', size); size();

  /* ---------- Conmutador Día / Noche ---------- */
  const bd = $('bd'), bn = $('bn');
  function show(n) { $('setD').classList.toggle('is-on', !n); $('setN').classList.toggle('is-on', !!n); }
  function press(n) { bd.setAttribute('aria-pressed', String(!n)); bn.setAttribute('aria-pressed', String(!!n)); }
  function begin(n, now) { target = n; from = k; start = now; swapped = false; animating = true; }
  function pick(n) {
    if (n === target && queued === null) return;
    press(n);
    if (calm) { target = n; k = n; show(n); return; }
    if (animating) queued = n; else begin(n, clock);
    wake();
  }
  bd.addEventListener('click', () => pick(0));
  bn.addEventListener('click', () => pick(1));
  show(startNight); press(startNight);
  window.heroSetMode = pick;

  /* ---------- Parallax con el puntero (efecto 3D) ---------- */
  let mx = 0, my = 0, tx = 0, ty = 0;
  if (fine && !calm) {
    hero.addEventListener('pointermove', e => {
      tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2;
    });
    hero.addEventListener('pointerleave', () => { tx = ty = 0; });
  }

  /* ---------- Bucle: solo corre mientras el hero es visible ---------- */
  let visible = true, raf = 0;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); }, { threshold: 0 }).observe(hero);
  function wake() { if (!raf) raf = requestAnimationFrame(loop); }

  function frame(now) {
    clock = now;
    const d = now - start;
    let y = 0, s = 0, dip = 0, k2 = k;
    if (animating) {
      if (d < SINK) { const x = d / SINK; y = x * x * (3 - 2 * x) * DEPTH; }
      else {
        if (!swapped) { swapped = true; show(target); }
        const x = clamp((d - SINK) / RISE); y = Math.pow(1 - x, 3.4) * DEPTH;
      }
      s = smooth(0, SINK * .92, d) * (1 - smooth(SINK + 70, SINK + RISE * .92, d));
      dip = smooth(30, 190, d) * (1 - smooth(330, 720, d));
      k = from + (target - from) * smooth(120, 520, d);
      k2 = from + (target - from) * smooth(340, 760, d);
      if (d >= SINK + RISE) {
        animating = false; k = k2 = target; y = s = dip = 0;
        if (queued !== null && queued !== target) { const q = queued; queued = null; begin(q, now); } else queued = null;
      }
    }
    mx += (tx - mx) * .06; my += (ty - my) * .06;
    const sc = clamp(scrollY / hero.clientHeight);
    root.setProperty('--sink', (y * hero.clientHeight).toFixed(1) + 'px');
    root.setProperty('--k', k.toFixed(3)); root.setProperty('--k2', k2.toFixed(3));
    root.setProperty('--dip', dip.toFixed(3));
    root.setProperty('--mx', mx.toFixed(3)); root.setProperty('--my', my.toFixed(3));
    root.setProperty('--scroll', sc.toFixed(3));
    if (gl) {
      gl.uniform2f(U.R, cv.width, cv.height); gl.uniform1f(U.T, now / 1000);
      gl.uniform1f(U.S, s); gl.uniform1f(U.K, k); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }
  function loop(t) {
    raf = 0;
    frame(t);
    if (visible || animating) raf = requestAnimationFrame(loop);
  }
  wake();
})();
