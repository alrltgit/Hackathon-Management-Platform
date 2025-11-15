document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.cards-container');
  const loader = document.getElementById('loader');

  // ---------- Sign In Elements ----------
  const signInBtn = document.getElementById('signInBtn');
  const loginCard = document.getElementById('loginCard');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  // ---------- SIGN-IN DROPDOWN HANDLING ----------
  if (signInBtn && loginCard) {
    // Toggle dropdown
    signInBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      const isOpen = loginCard.classList.contains('show');

      if (isOpen) {
        loginCard.classList.remove('show');
        setTimeout(() => loginCard.classList.add('hidden'), 200);
      } else {
        loginCard.classList.remove('hidden');
        setTimeout(() => loginCard.classList.add('show'), 10);
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!loginCard.contains(e.target) && e.target !== signInBtn) {
        if (loginCard.classList.contains('show')) {
          loginCard.classList.remove('show');
          setTimeout(() => loginCard.classList.add('hidden'), 200);
        }
      }
    });

    // Prevent closing when clicking inside card
    loginCard.addEventListener('click', (e) => e.stopPropagation());

    // ******** LOGIN FORM VALIDATION ********
    if (loginForm && loginError) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
          loginError.textContent = 'Please fill in all fields.';
          return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
          loginError.textContent = 'Please enter a valid email.';
          return;
        }

        loginError.textContent = '';
        alert('Login form submitted (backend pending)');
      });
    }
  }

  // ---------- Loader ----------
  function showLoader() {
    loader?.classList.remove('hidden');
    container?.classList.add('hidden');
  }

  function hideLoader() {
    loader?.classList.add('hidden');
    container?.classList.remove('hidden');
  }

  // ---------- Fetch and Render Challenges ----------
  async function loadChallenges() {
    if (!container) return;

    showLoader();
    const start = Date.now();

    try {
      const response = await fetch('/api/challenges');
      if (!response.ok) throw new Error('Network error');

      const challenges = await response.json();
      renderCards(challenges);
    } catch (error) {
      console.error('Error fetching:', error);
      container.innerHTML = '<p>Failed to load challenges.</p>';
    }

    const minDuration = 300;
    const elapsed = Date.now() - start;
    setTimeout(hideLoader, Math.max(0, minDuration - elapsed));
  }

  function renderCards(challenges) {
    container.innerHTML = '';

    challenges.forEach((challenge, index) => {
      const fullText = challenge.description || '';
      const cutoff = 150;

      const shortText =
        fullText.length > cutoff
          ? fullText.slice(0, cutoff).replace(/\s+\S*$/, '') + '...'
          : fullText;

      const card = document.createElement('div');
      card.classList.add('challenge-card');

      card.innerHTML = `
        <div class="challenge-card-item">
          <h3 class="challenge-title">${challenge.name}</h3>

          <p class="challenge-description" id="desc-${index}"
             data-full="${fullText}"
             data-short="${shortText}">
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

          <a href="#" class="challenge-btn">Start Challenge</a>
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
        const expanded = desc.classList.contains('expanded');

        if (!expanded) {
          desc.textContent = desc.dataset.full;
          desc.classList.add('expanded');
          link.textContent = 'See less';
        } else {
          desc.textContent = desc.dataset.short;
          desc.classList.remove('expanded');
          link.textContent = 'See more';
        }
      });
    });
  }

  // ---------- Start Challenge → Upload Page ----------
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('challenge-btn')) {
      e.preventDefault();
      window.location.href = '/upload';
    }
  });

  // ---------- Initial Load ----------
  loadChallenges();
});
