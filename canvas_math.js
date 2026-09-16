const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let points = [];

function resize() {
  width = canvas.width = canvas.offsetWidth;
  height = canvas.height = canvas.offsetHeight;
  initPoints();
}

function initPoints() {
  points = [];
  const count = Math.floor((width * height) / 9000);
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6
    });
  }
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  // Draw connecting lines based on distance
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.strokeStyle = `rgba(30, 40, 50, ${0.15 * (1 - dist / 100)})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  // Update and draw points
  points.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 40, 50, 0.4)';
    ctx.fill();
  });

  requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
resize();
animate();
