// Select the container where cards will go
const container = document.querySelector('.cards-container');

// Fetch data from your Flask API
async function loadChallenges() {
  try {
    const response = await fetch('/api/challenges');
    if (!response.ok) throw new Error('Network response was not ok');

    const challenges = await response.json();
    renderCards(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    container.innerHTML = '<p>Failed to load challenges.</p>';
  }
}

// Render the cards in the DOM
function renderCards(challenges) {
  // Clear the container first
  container.innerHTML = '';

  challenges.forEach((challenge) => {
    const card = document.createElement('div');
    card.classList.add('challenge-card');

    // Build the inner HTML of the card
    card.innerHTML = `
      <h3 class="challenge-title">${challenge.name}</h3>
      <p class="challenge-description">${challenge.description}</p>
      <p class="challenge-category"><strong>Category:</strong> ${
        challenge.category
      }</p>
      <p class="challenge-languages"><strong>Languages:</strong> ${challenge.languages.join(
        ', '
      )}</p>
      <p class="challenge-submission-time"><strong>Submission Time:</strong> ${
        challenge.submission_time
      }</p>
      <button class="challenge-btn">Start Challenge</button>
    `;

    container.appendChild(card);
  });
}

// Load challenges on page load
loadChallenges();
