let catalog;

const $ = (selector) => document.querySelector(selector);

function money(value) {
  return `$${Number(value).toLocaleString('en-CA')}`;
}

function durationText(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins} minutes`;
  return mins ? `${hours} hr ${mins} min` : `${hours} hours`;
}

function currentEstimateInput() {
  return {
    serviceSlug: $('#service').value,
    propertyType: $('#propertyType').value,
    bedrooms: Number($('#bedrooms').value),
    bathrooms: Number($('#bathrooms').value),
    squareFeet: Number($('#squareFeet').value),
    frequency: $('#frequency').value,
    addOnSlugs: [...document.querySelectorAll('input[name="addOn"]:checked')].map((input) => input.value)
  };
}

async function updateEstimate() {
  const response = await fetch('/api/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currentEstimateInput())
  });
  const estimate = await response.json();
  $('#estimateRange').textContent = `${money(estimate.low)}–${money(estimate.high)}`;
  $('#estimateDuration').textContent = `Estimated duration: ${durationText(estimate.durationMinutes)}`;
  $('#estimateLines').innerHTML = estimate.lines
    .map((line) => `<li>${line.label}: ${line.amount < 0 ? '−' : ''}${money(Math.abs(line.amount))}</li>`)
    .join('');
  return estimate;
}

function renderCatalog() {
  $('#services').innerHTML = catalog.services.map((service) => `
    <article class="service-card">
      <p class="tagline">${service.tagline}</p>
      <h3>${service.name}</h3>
      <p>${service.description}</p>
      <ul>${service.includes.map((item) => `<li>${item}</li>`).join('')}</ul>
      <div class="meta"><span>From ${money(service.basePrice)}</span><span>${durationText(service.durationMinutes)}</span></div>
    </article>
  `).join('');

  $('#service').innerHTML = catalog.services.map((service) => `<option value="${service.slug}">${service.name}</option>`).join('');
  $('#propertyType').innerHTML = catalog.propertyTypes.map((type) => `<option value="${type.slug}">${type.label}</option>`).join('');
  $('#frequency').innerHTML = catalog.frequencies.map((frequency) => `<option value="${frequency.slug}">${frequency.label}</option>`).join('');
  $('#timeSlots').innerHTML = catalog.timeSlots.map((slot) => `<option>${slot}</option>`).join('');
  $('#addOns').innerHTML = catalog.addOns.map((addOn) => `
    <label><input type="checkbox" name="addOn" value="${addOn.slug}" /> ${addOn.name} (${money(addOn.price)})</label>
  `).join('');
}

async function askAssistant(question) {
  const chat = $('#chat');
  chat.insertAdjacentHTML('beforeend', `<div class="message user">${question}</div>`);
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  const data = await response.json();
  chat.insertAdjacentHTML('beforeend', `<div class="message assistant">${data.answer}</div>`);
  chat.scrollTop = chat.scrollHeight;
}

async function init() {
  const response = await fetch('/api/catalog');
  catalog = await response.json();
  renderCatalog();
  await updateEstimate();
  await askAssistant('What services do you offer?');
}

document.addEventListener('change', (event) => {
  if (event.target.closest('#estimate')) updateEstimate();
});
document.addEventListener('input', (event) => {
  if (event.target.closest('#estimate')) updateEstimate();
});

$('#bookingForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const payload = { ...currentEstimateInput(), ...Object.fromEntries(form.entries()) };
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const booking = await response.json();
  $('#bookingResult').innerHTML = response.ok
    ? `<strong>Booking ${booking.reference} received.</strong><br />Estimated price: ${money(booking.estimate.low)}–${money(booking.estimate.high)}<br />Preferred time: ${booking.preferredDate}, ${booking.preferredTime}`
    : `Could not submit booking: ${booking.error}`;
});

$('#chatForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = $('#chatInput');
  if (!input.value.trim()) return;
  const question = input.value.trim();
  input.value = '';
  await askAssistant(question);
});

document.querySelectorAll('.suggestion').forEach((button) => {
  button.addEventListener('click', () => askAssistant(button.textContent));
});

init();
