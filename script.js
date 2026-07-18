const canvas = document.getElementById("hexCanvas");
const ctx = canvas.getContext("2d");
const toggles = document.querySelectorAll(".toggle");
const prices = document.querySelectorAll(".price");
const ratingFields = document.querySelectorAll(".rating-field");
const paymentLinks = document.querySelectorAll(".payment-link");

let width = 0;
let height = 0;
let hexes = [];
let animationFrame = 0;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  buildHexes();
}

function buildHexes() {
  hexes = [];
  const size = width < 700 ? 34 : 48;
  const horizontal = size * 1.72;
  const vertical = size * 1.48;

  for (let y = -size; y < height + size; y += vertical) {
    for (let x = -size; x < width + size; x += horizontal) {
      const offset = Math.round(y / vertical) % 2 ? horizontal / 2 : 0;
      const distanceFromHero = Math.hypot(x - width * 0.25, y - height * 0.38);
      const intensity = Math.max(0.05, 1 - distanceFromHero / Math.max(width, height));
      hexes.push({
        x: x + offset,
        y,
        size,
        phase: Math.random() * Math.PI * 2,
        intensity
      });
    }
  }
}

function drawHex(x, y, size, alpha) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = Math.PI / 6 + i * Math.PI / 3;
    const pointX = x + Math.cos(angle) * size;
    const pointY = y + Math.sin(angle) * size;
    if (i === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(227, 19, 44, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function animate(time) {
  ctx.clearRect(0, 0, width, height);
  hexes.forEach((hex) => {
    const pulse = (Math.sin(time * 0.0012 + hex.phase) + 1) / 2;
    const alpha = (0.04 + pulse * 0.18) * hex.intensity;
    drawHex(hex.x, hex.y, hex.size, alpha);
  });
  animationFrame = requestAnimationFrame(animate);
}

function setPricingMode(mode) {
  toggles.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  prices.forEach((price) => {
    price.textContent = price.dataset[mode];
  });
}

toggles.forEach((button) => {
  button.addEventListener("click", () => setPricingMode(button.dataset.mode));
});

ratingFields.forEach((field) => {
  const input = field.querySelector("input");
  const output = field.querySelector("output");

  input.addEventListener("input", () => {
    output.textContent = input.value;
  });
});

paymentLinks.forEach((link) => {
  const paymentUrl = window.HEXA_PAYMENT_LINKS?.[link.dataset.tier];

  if (paymentUrl) {
    link.href = paymentUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
  }
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
cancelAnimationFrame(animationFrame);
animationFrame = requestAnimationFrame(animate);
