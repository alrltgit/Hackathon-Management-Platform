document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.cards-container');
  const loader = document.getElementById('loader');

  // ---------- Sign In Elements (optional) ----------
  const signInBtn = document.getElementById('signInBtn');
  const loginCard = document.getElementById('loginCard');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  if (signInBtn && loginCard && loginForm && loginError) {
    // ---------- Sign In card toggle ----------
    signInBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (loginCard.classList.contains('show')) {
        loginCard.classList.remove('show');
        setTimeout(() => loginCard.classList.add('hidden'), 300);
      } else {
        loginCard.classList.remove('hidden');
        setTimeout(() => loginCard.classList.add('show'), 10);
      }
    });

    // ---------- Close login card when clicking outside ----------
    document.addEventListener('click', (e) => {
      if (!loginCard.contains(e.target) && !signInBtn.contains(e.target)) {
        if (loginCard.classList.contains('show')) {
          loginCard.classList.remove('show');
          setTimeout(() => loginCard.classList.add('hidden'), 300);
        }
      }
    });

    // ---------- Login form validation ----------
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!email || !password) {
        loginError.textContent = 'Please fill in all fields.';
        return;
      }

      if (!validateEmail(email)) {
        loginError.textContent = 'Please enter a valid email.';
        return;
      }

      loginError.textContent = '';
      console.log('Logging in with:', email, password);
      alert('Form submitted (backend integration pending)');
    });

    function validateEmail(email) {
      const re = /\S+@\S+\.\S+/;
      return re.test(email);
    }
  }

  // ---------- Loader functions ----------
  function showLoader() {
    if (loader) loader.classList.remove('hidden');
    if (container) container.classList.add('hidden');
  }

  function hideLoader() {
    if (loader) loader.classList.add('hidden');
    if (container) container.classList.remove('hidden');
  }

  // ---------- Fetch and render challenges ----------
  async function loadChallenges() {
    if (!container) return; // do nothing if no container
    showLoader();
    const start = Date.now();

    try {
      const response = await fetch('/api/challenges');
      if (!response.ok) throw new Error('Network error');

      const challenges = await response.json();
      renderCards(challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      container.innerHTML = '<p>Failed to load challenges.</p>';
    }

    const elapsed = Date.now() - start;
    const minDuration = 300;
    if (elapsed < minDuration) {
      setTimeout(hideLoader, minDuration - elapsed);
    } else {
      hideLoader();
    }
  }

  function renderCards(challenges) {
    container.innerHTML = '';

    challenges.forEach((challenge, index) => {
      const fullText = challenge.description || '';
      const cutoff = 150;

      let shortText =
        fullText.length > cutoff
          ? fullText.slice(0, cutoff).replace(/\s+\S*$/, '') + '...'
          : fullText;

      const escapedFull = fullText
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      const escapedShort = shortText
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      const card = document.createElement('div');
      card.classList.add('challenge-card');

      card.innerHTML = `
        <div class="challenge-card-item">
          <h3 class="challenge-title">${challenge.name}</h3>

          <p class="challenge-description"
             id="desc-${index}"
             data-full="${escapedFull}"
             data-short="${escapedShort}">
            ${shortText}
          </p>

          ${
            fullText.length > cutoff
              ? `<a href="#" class="see-more" data-index="${index}">See more</a>`
              : ''
          }

          <p class="challenge-category"><strong>Category:</strong> ${
            challenge.category
          }</p>
          <p class="challenge-languages"><strong>Languages:</strong> ${challenge.languages.join(
            ', '
          )}</p>
          <p class="challenge-submission-time"><strong>Submission Time:</strong> ${
            challenge.submission_time
          }</p>

          <a href="/some-route-or-url" class="challenge-btn">Start Challenge</a>
        </div>
      `;

      container.appendChild(card);
    });

    attachSeeMoreHandlers();
  }

  function attachSeeMoreHandlers() {
    document.querySelectorAll('.see-more').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const index = link.dataset.index;
        const desc = document.getElementById(`desc-${index}`);
        if (!desc) return;

        const full = desc.dataset.full;
        const short = desc.dataset.short;
        const isExpanded = desc.classList.contains('expanded');

        if (!isExpanded) {
          desc.textContent = full;
          desc.classList.add('expanded');
          link.textContent = 'See less';
        } else {
          desc.textContent = short;
          desc.classList.remove('expanded');
          link.textContent = 'See more';
        }
      });
    });
  }

  // ---------- Initial load ----------
  loadChallenges();
});
