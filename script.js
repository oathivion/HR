const canvas = document.getElementById("hexCanvas");
const ctx = canvas.getContext("2d");
const toggles = document.querySelectorAll(".toggle");
const prices = document.querySelectorAll(".price");
const ratingFields = document.querySelectorAll(".rating-field");
const paymentLinks = document.querySelectorAll(".payment-link");
const reviewForm = document.querySelector(".review-form");
const reviewLists = document.querySelectorAll("[data-review-list]");
const reviewAverageTargets = document.querySelectorAll("[data-review-average]");
const reviewFactorBars = document.querySelectorAll("[data-review-factor]");

const reviewFactorLabels = {
  evaluatorExpertise: "Evaluator expertise",
  technicalAccuracy: "Technical accuracy",
  roleRelevance: "Role relevance",
  fairnessConsistency: "Fairness and consistency",
  turnaroundSpeed: "Turnaround speed",
  communicationQuality: "Communication quality",
  reportClarity: "Report clarity",
  candidateExperience: "Candidate experience",
  securityConfidence: "Security confidence",
  valueForMoney: "Value for money"
};

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
  const tierConfig = window.HEXA_PAYMENT_LINKS?.[link.dataset.tier];
  const paymentUrl = typeof tierConfig === "string"
    ? tierConfig
    : tierConfig?.[link.dataset.paymentType || "full"];

  if (paymentUrl) {
    link.href = paymentUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
  }
});

function getReviewScore(review) {
  const scores = Object.values(review.ratings || {});
  if (!scores.length) {
    return 0;
  }
  return Math.round((scores.reduce((total, score) => total + Number(score), 0) / scores.length) * 10);
}

function getReviewAverage(reviews) {
  if (!reviews.length) {
    return 0;
  }
  return Math.round(reviews.reduce((total, review) => total + getReviewScore(review), 0) / reviews.length);
}

function getFactorAverage(reviews, factor) {
  const scores = reviews
    .map((review) => Number(review.ratings?.[factor]))
    .filter((score) => Number.isFinite(score));

  if (!scores.length) {
    return 0;
  }
  return Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 10);
}

function renderReviewCard(review) {
  const score = getReviewScore(review);
  const factors = Object.entries(reviewFactorLabels)
    .map(([key, label]) => `<span>${label}<strong>${review.ratings?.[key] || "-"} / 10</strong></span>`)
    .join("");

  return `
    <details class="review-card">
      <summary>
        <span>
          <h3>${review.company}</h3>
          <span class="review-meta">${review.role} - ${review.reviewer}</span>
        </span>
        <span class="review-score">${score}</span>
      </summary>
      <blockquote>${review.quote}</blockquote>
      <p class="review-score-note">Published ${review.date}. Open scorecard:</p>
      <div class="factor-list">${factors}</div>
    </details>
  `;
}

function renderReviews() {
  const reviews = window.HEXA_REVIEWS || [];
  const average = getReviewAverage(reviews);

  reviewAverageTargets.forEach((target) => {
    target.textContent = average || "0";
    target.closest(".score-ring")?.style.setProperty("--score", average || 0);
  });

  reviewFactorBars.forEach((bar) => {
    const score = getFactorAverage(reviews, bar.dataset.reviewFactor);
    if (score) {
      bar.style.setProperty("--bar", `${score}%`);
    }
  });

  reviewLists.forEach((list) => {
    const limit = Number(list.dataset.reviewLimit) || reviews.length;
    list.innerHTML = reviews.slice(0, limit).map(renderReviewCard).join("");
  });
}

renderReviews();

function cleanJsString(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n");
}

reviewForm?.addEventListener("submit", () => {
  const snippetTarget = reviewForm.querySelector("[data-review-snippet]");
  const getField = (name) => reviewForm.querySelector(`[data-review-field="${name}"]`)?.value || "";
  const ratings = {};

  reviewForm.querySelectorAll("[data-review-rating]").forEach((input) => {
    ratings[input.dataset.reviewRating] = Number(input.value);
  });

  const today = new Date().toISOString().slice(0, 10);
  snippetTarget.value = `{
  company: "${cleanJsString(getField("company"))}",
  role: "${cleanJsString(getField("role"))}",
  reviewer: "${cleanJsString(getField("reviewer"))}",
  date: "${today}",
  ratings: {
    evaluatorExpertise: ${ratings.evaluatorExpertise},
    technicalAccuracy: ${ratings.technicalAccuracy},
    roleRelevance: ${ratings.roleRelevance},
    fairnessConsistency: ${ratings.fairnessConsistency},
    turnaroundSpeed: ${ratings.turnaroundSpeed},
    communicationQuality: ${ratings.communicationQuality},
    reportClarity: ${ratings.reportClarity},
    candidateExperience: ${ratings.candidateExperience},
    securityConfidence: ${ratings.securityConfidence},
    valueForMoney: ${ratings.valueForMoney}
  },
  quote: "${cleanJsString(getField("quote"))}"
}`;
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
cancelAnimationFrame(animationFrame);
animationFrame = requestAnimationFrame(animate);
