/* ==================== MOBILE NAVIGATION CONTROL ==================== */
const menuButton = document.querySelector('.menu-button');
const siteNav = document.querySelector('.site-nav');
if (menuButton && siteNav) {
  menuButton.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}

/* ==================== SHARED REVIEW DATABASE CONTROL ====================
   Reviews and pictures are stored online in Supabase and shared by all visitors.
   Connection values come from supabase-config.js. */
const database = window.BRICK_BEYOND_SUPABASE;
const apiHeaders = database ? {
  apikey: database.publishableKey,
  Authorization: `Bearer ${database.publishableKey}`
} : {};
let sharedReviews = [];

function stars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function safeText(value) {
  const span = document.createElement('span');
  span.textContent = value || '';
  return span.innerHTML;
}

function reviewCard(review) {
  const name = review.reviewer_name || review.name;
  const text = review.review_text || review.text;
  const date = review.created_at || review.date;
  const photo = review.photo_url || review.photo;
  return `<article class="review-card">
    ${photo ? `<img class="review-photo" src="${safeText(photo)}" alt="Photo attached to ${safeText(name)}'s review" loading="lazy">` : ''}
    <div class="stars" aria-label="${review.rating} out of 5 stars">${stars(review.rating)}</div>
    <blockquote>“${safeText(text)}”</blockquote>
    <footer><strong>${safeText(name)}</strong><time>${new Date(date).toLocaleDateString()}</time></footer>
  </article>`;
}

async function loadSharedReviews() {
  const featuredReviews = document.querySelector('#featuredReviews');
  const allReviews = document.querySelector('#allReviews');
  if (!featuredReviews && !allReviews) return;
  if (!database) {
    showReviewError('The review database has not been configured.');
    return;
  }
  try {
    const response = await fetch(`${database.url}/rest/v1/reviews?select=*&order=rating.desc,created_at.desc`, {
      headers: apiHeaders
    });
    if (!response.ok) throw new Error(`Database returned ${response.status}`);
    sharedReviews = await response.json();
    renderFeaturedReviews();
    renderAllReviews();
  } catch (error) {
    console.error('Review loading error:', error);
    showReviewError('Reviews are being connected. Please check back soon.');
  }
}

function showReviewError(message) {
  const markup = `<p class="empty-state">${safeText(message)}</p>`;
  const featuredReviews = document.querySelector('#featuredReviews');
  const allReviews = document.querySelector('#allReviews');
  if (featuredReviews) featuredReviews.innerHTML = markup;
  if (allReviews) allReviews.innerHTML = markup;
}

/* ==================== HOME PAGE FEATURED REVIEWS ==================== */
function renderFeaturedReviews() {
  const featuredReviews = document.querySelector('#featuredReviews');
  if (!featuredReviews) return;
  const featured = [...sharedReviews]
    .sort((a, b) => b.rating - a.rating || new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);
  featuredReviews.innerHTML = featured.length
    ? featured.map(reviewCard).join('')
    : '<p class="empty-state">No reviews yet. Be the first to leave one.</p>';
}

/* ==================== ALL REVIEWS PAGE & SORTING CONTROL ==================== */
const allReviews = document.querySelector('#allReviews');
const reviewSort = document.querySelector('#reviewSort');
function renderAllReviews() {
  if (!allReviews) return;
  const reviews = [...sharedReviews];
  const mode = reviewSort?.value || 'rating';
  reviews.sort(mode === 'newest'
    ? (a, b) => new Date(b.created_at) - new Date(a.created_at)
    : (a, b) => b.rating - a.rating || new Date(b.created_at) - new Date(a.created_at));
  allReviews.innerHTML = reviews.length
    ? reviews.map(reviewCard).join('')
    : '<p class="empty-state">No reviews yet. Be the first to leave one.</p>';
}
if (reviewSort) reviewSort.addEventListener('change', renderAllReviews);
loadSharedReviews();

/* ==================== REVIEW PHOTO PREVIEW CONTROL ==================== */
const reviewPhoto = document.querySelector('#reviewPhoto');
const photoPreview = document.querySelector('#photoPreview');
if (reviewPhoto) {
  reviewPhoto.addEventListener('change', () => {
    const file = reviewPhoto.files[0];
    if (!file) {
      photoPreview.hidden = true;
      photoPreview.removeAttribute('src');
      return;
    }
    if (file.size > 1500000) {
      alert('Please choose an image smaller than 1.5 MB.');
      reviewPhoto.value = '';
      return;
    }
    photoPreview.src = URL.createObjectURL(file);
    photoPreview.hidden = false;
  });
}

/* ==================== REVIEW PHOTO UPLOAD CONTROL ==================== */
async function uploadReviewPhoto(file) {
  if (!file) return null;
  const extension = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const filename = `public/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const response = await fetch(`${database.url}/storage/v1/object/review-photos/${filename}`, {
    method: 'POST',
    headers: {...apiHeaders, 'Content-Type': file.type, 'x-upsert': 'false'},
    body: file
  });
  if (!response.ok) throw new Error(`Photo upload returned ${response.status}`);
  return `${database.url}/storage/v1/object/public/review-photos/${filename}`;
}

/* ==================== REVIEW FORM SUBMISSION CONTROL ==================== */
const reviewForm = document.querySelector('#reviewForm');
if (reviewForm) {
  reviewForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = reviewForm.querySelector('button[type="submit"]');
    const data = new FormData(reviewForm);
    const rating = Number(data.get('rating'));
    if (!rating) {
      alert('Please select a star rating.');
      return;
    }
    if (!database) {
      alert('The review database has not been configured.');
      return;
    }
    button.disabled = true;
    button.textContent = 'Submitting Review…';
    try {
      const photoUrl = await uploadReviewPhoto(reviewPhoto.files[0]);
      const response = await fetch(`${database.url}/rest/v1/reviews`, {
        method: 'POST',
        headers: {...apiHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal'},
        body: JSON.stringify({
          reviewer_name: data.get('reviewerName').trim(),
          rating,
          review_text: data.get('reviewText').trim(),
          photo_url: photoUrl
        })
      });
      if (!response.ok) throw new Error(`Review submission returned ${response.status}`);
      sessionStorage.setItem('welcomeType', 'review');
      window.location.href = 'welcome.html';
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Your review could not be submitted. Please try again.');
      button.disabled = false;
      button.textContent = 'Submit Review';
    }
  });
}

/* ==================== ESTIMATE FORM SUBMISSION CONTROL ==================== */
const estimateForm = document.querySelector('#estimateForm');
if (estimateForm) {
  estimateForm.addEventListener('submit', () => {
    sessionStorage.setItem('welcomeType', 'estimate');
    setTimeout(() => { window.location.href = 'welcome.html'; }, 650);
  });
}

/* ==================== WELCOME PAGE & AUTOMATIC RETURN CONTROL ==================== */
const welcomeTitle = document.querySelector('#welcomeTitle');
if (welcomeTitle) {
  const type = sessionStorage.getItem('welcomeType') || 'estimate';
  const welcomeMessage = document.querySelector('#welcomeMessage');
  welcomeTitle.textContent = type === 'review' ? 'Thank you for your review!' : 'Thank you for reaching out!';
  welcomeMessage.textContent = type === 'review'
    ? 'Your feedback is now shared with visitors. We appreciate you sharing your experience.'
    : 'Your estimate request has been submitted. Our team will contact you as soon as possible.';
  let seconds = 6;
  const timer = document.querySelector('#countdown');
  timer.textContent = seconds;
  const interval = setInterval(() => {
    seconds -= 1;
    timer.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(interval);
      window.location.href = type === 'review' ? 'reviews.html' : 'index.html';
    }
  }, 1000);
}
