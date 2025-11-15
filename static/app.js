const container = document.querySelector('.cards-container');
const loader = document.getElementById('loader');

// Show/hide loader
function showLoader() {
  loader.classList.remove('hidden');
  container.classList.add('hidden');
}

function hideLoader() {
  loader.classList.add('hidden');
  container.classList.remove('hidden');
}

// Fetch challenges from API
async function loadChallenges() {
  showLoader();

  const start = Date.now(); // minimum loader display time

  try {
    const response = await fetch('/api/challenges');
    if (!response.ok) throw new Error('Network error');

    const challenges = await response.json();
    renderCards(challenges);
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p>Failed to load challenges.</p>';
  }

  // Minimum loader display time
  const elapsed = Date.now() - start;
  const minDuration = 300;
  if (elapsed < minDuration) {
    setTimeout(hideLoader, minDuration - elapsed);
  } else {
    hideLoader();
  }
}

// Render all cards
function renderCards(challenges) {
  container.innerHTML = '';

  challenges.forEach((challenge, index) => {
    const fullText = challenge.description || '';
    const cutoff = 150;

    // Short text without cutting mid-word
    let shortText =
      fullText.length > cutoff
        ? fullText.slice(0, cutoff).replace(/\s+\S*$/, '') + '...'
        : fullText;

    // Escape quotes for data attributes
    const escapedFull = fullText.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

// Handle See more / See less toggling
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
        desc.textContent = full; // safely show full text
        desc.classList.add('expanded');
        link.textContent = 'See less';
      } else {
        desc.textContent = short; // safely collapse to short text
        desc.classList.remove('expanded');
        link.textContent = 'See more';
      }
    });
  });
}

// Load challenges when page loads
loadChallenges();
