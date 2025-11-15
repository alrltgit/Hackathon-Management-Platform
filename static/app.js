const container = document.querySelector('.cards-container');
const loader = document.getElementById('loader');

function showLoader() {
  loader.classList.remove('hidden');
  container.classList.add('hidden');
}

function hideLoader() {
  loader.classList.add('hidden');
  container.classList.remove('hidden');
}

async function loadChallenges() {
  showLoader();

  const start = Date.now(); // for minimum display time

  try {
    const response = await fetch('/api/challenges');
    if (!response.ok) throw new Error('Network error');

    const challenges = await response.json();
    renderCards(challenges);
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p>Failed to load challenges.</p>';
  }

  // Make loader visible at least 300ms
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
    const fullText = challenge.description;
    const shortText =
      fullText.length > 150 ? fullText.slice(0, 150) + '...' : fullText;

    const card = document.createElement('div');
    card.classList.add('challenge-card');

    card.innerHTML = `
      <div class="challenge-card-item">

        <h3 class="challenge-title">${challenge.name}</h3>

        <p class="challenge-description"
           id="desc-${index}"
           data-full="${fullText}"
           data-short="${shortText}">
            ${shortText}
        </p>

        ${
          fullText.length > 150
            ? `<a href="#" class="see-more" data-index="${index}">See more</a>`
            : ''
        }

        <p class="challenge-category"><strong>Category:</strong> ${
          challenge.category
        }</p>

        <p class="challenge-languages">
          <strong>Languages:</strong> ${challenge.languages.join(', ')}
        </p>

        <p class="challenge-submission-time">
          <strong>Submission Time:</strong> ${challenge.submission_time}
        </p>

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

      const full = desc.dataset.full;
      const short = desc.dataset.short;
      const isExpanded = desc.classList.contains('expanded');

      desc.classList.add('collapsing');

      if (!isExpanded) {
        desc.textContent = full;
        desc.classList.add('expanded');
        link.textContent = 'See less';
      } else {
        desc.textContent = short;
        desc.classList.remove('expanded');
        link.textContent = 'See more';
      }

      setTimeout(() => desc.classList.remove('collapsing'), 150);
    });
  });
}

loadChallenges();
