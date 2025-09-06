// stars.js
(() => {
  const header = document.querySelector('header');

  // Ensure a canvas exists (create if missing)
  let canvas = document.getElementById('starCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'starCanvas';
    header.prepend(canvas);
  }

  const ctx = canvas.getContext('2d');

  function sizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = header.clientWidth;
    const h = header.clientHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function randColor() {
    const colors = ['#ffffff', '#7ec8ff', '#ff6b6b']; // white, blue, red
    return colors[(Math.random() * colors.length) | 0];
  }

  function drawStars() {
    const w = header.clientWidth;
    const h = header.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // Density-based count so it scales with header size
    const count = Math.max(200, Math.floor((w * h) / 3000));
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 1.8 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.globalAlpha = 0.7 + Math.random() * 0.3; // subtle brightness variation
      ctx.fillStyle = randColor();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    sizeCanvas();
    drawStars();
  }

  window.addEventListener('resize', render);
  render();
})();
