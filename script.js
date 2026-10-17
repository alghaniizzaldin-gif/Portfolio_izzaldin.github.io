document.documentElement.classList.add('js');

const $ = id => document.getElementById(id);
const ball = $('ball'), spin = ball.querySelector('svg'), net = $('net'), pop = $('pop');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const HOME = {x: 30, y: 330}, FLOOR = 330, RIM = {x: 185, y: 112};
let rot = 0, busy = false, made = 0, missed = 0;

const tween = (ms, fn) => new Promise(done => {
  const start = performance.now();
  (function frame(now) {
    const t = Math.min((now - start) / ms, 1);
    fn(t);
    t < 1 ? requestAnimationFrame(frame) : done();
  })(start);
});

const place = (x, y, r = rot) => {
  ball.style.transform = `translate(${x}px,${y}px)`;
  spin.style.transform = `rotate(${r}deg)`;
};

const arc = async (a, b, height, ms, turn) => {
  const r0 = rot;
  await tween(ms, t => place(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - 4 * height * t * (1 - t), r0 + turn * t));
  rot = r0 + turn;
};

const drop = async (x, y0) => {
  await tween(380, t => place(x, y0 + (FLOOR - y0) * t * t));
  await tween(300, t => place(x, FLOOR - 50 * 4 * t * (1 - t)));
};

const back = async x => {
  const r0 = rot;
  await tween(500, t => place(x + (HOME.x - x) * t, FLOOR, r0 - 360 * t));
  rot = r0 - 360;
};

const say = text => {
  pop.textContent = text;
  pop.classList.remove('show');
  void pop.offsetWidth;
  pop.classList.add('show');
};

async function shoot() {
  if (busy) return;
  busy = true;
  ball.classList.add('played');
  $('hint').hidden = true;
  const ok = Math.random() < 0.65;
  const end = ok ? RIM : {x: RIM.x + 42, y: RIM.y - 6};
  ball.style.zIndex = 2;

  await arc(HOME, end, 170, 900, 540);
  if (ok) {
    ball.style.zIndex = 0;
    net.classList.remove('swish');
    void net.getBoundingClientRect();
    net.classList.add('swish');
    $('made').textContent = ++made;
    say('SWISH!');
    await drop(end.x, end.y);
    ball.style.zIndex = 2;
    await back(end.x);
  } else {
    $('missed').textContent = ++missed;
    say('Yah, meleset!');
    await arc(end, {x: 290, y: FLOOR}, 60, 650, 200);
    await back(290);
  }
  busy = false;
}

ball.addEventListener('click', shoot);

if (!reduce) {
  busy = true;
  place(HOME.x, -90, 0);
  drop(HOME.x, -90).then(() => { busy = false; });
}

const bars = document.querySelector('.bars');
new IntersectionObserver((entries, io) => {
  entries.forEach(e => { if (e.isIntersecting) { bars.classList.add('in'); io.disconnect(); } });
}, {threshold: 0.4}).observe(bars);
