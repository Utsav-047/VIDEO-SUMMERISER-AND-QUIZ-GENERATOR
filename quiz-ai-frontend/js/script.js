// ===== Backend connection check =====
const BACKEND_URL = 'http://127.0.0.1:5000';

const backendStatus = document.getElementById('backendStatus');

fetch(BACKEND_URL + '/')
  .then((res) => res.json())
  .then((data) => {
    backendStatus.textContent = '● Backend connected: ' + data.status;
    backendStatus.style.color = '#4FD1B5';
    backendStatus.style.background = 'rgba(79, 209, 181, 0.1)';
  })
  .catch(() => {
    backendStatus.textContent = '● Backend not reachable — is app.py running?';
    backendStatus.style.color = '#E24B4A';
    backendStatus.style.background = 'rgba(226, 75, 74, 0.1)';
  });

// ===== Element references =====
const processBtn    = document.getElementById('processBtn');
const toQuizBtn      = document.getElementById('toQuizBtn');
const submitQuizBtn  = document.getElementById('submitQuizBtn');

const panelUpload    = document.getElementById('panel-upload');
const panelLoading   = document.getElementById('panel-loading');
const panelResult    = document.getElementById('panel-result');
const panelQuiz      = document.getElementById('panel-quiz');
const panelScore     = document.getElementById('panel-score');

const loaderText     = document.getElementById('loaderText');
const scoreText      = document.getElementById('scoreText');
const transcriptText = document.getElementById('transcriptText');
const summaryText    = document.getElementById('summaryText');
const quizContainer  = document.getElementById('quizContainer');
const ytLinkInput    = document.getElementById('ytLink');

// ===== State: keep track of data across steps =====
let currentVideoId = null;
let currentTranscript = null;
let currentQuizId = null;
let currentQuestions = [];

// ===== Update pipeline rail (step 1 to 4) =====
function setStep(activeStep) {
  document.querySelectorAll('.rail-step').forEach((el) => {
    const step = parseInt(el.dataset.step);
    const dot = el.querySelector('.rail-dot');
    const label = el.querySelector('.rail-label');

    dot.classList.remove('active', 'done');
    label.classList.remove('active');

    if (step < activeStep) {
      dot.classList.add('done');
      dot.innerHTML = '<i class="ti ti-check"></i>';
      label.classList.add('active');
    } else if (step === activeStep) {
      dot.classList.add('active');
      dot.textContent = step;
      label.classList.add('active');
    } else {
      dot.textContent = step;
    }
  });
}

function showLoader(message) {
  panelUpload.classList.add('hidden');
  panelResult.classList.add('hidden');
  panelQuiz.classList.add('hidden');
  panelLoading.classList.remove('hidden');
  loaderText.textContent = message;
}

function showError(message) {
  panelLoading.classList.add('hidden');
  panelUpload.classList.remove('hidden');
  alert('Error: ' + message); // simple for now — replace with a nicer inline error banner later
}

// ===== Step 1 -> Step 2: Process video (REAL backend call) =====
processBtn.addEventListener('click', async () => {
  const youtubeUrl = ytLinkInput.value.trim();

  if (!youtubeUrl) {
    alert('Please paste a YouTube link');
    return;
  }

  showLoader('Downloading video and extracting audio...');

  try {
    const response = await fetch(BACKEND_URL + '/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtube_url: youtubeUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Processing failed');
    }

    currentVideoId = data.video_id;
    currentTranscript = data.transcript;

    transcriptText.textContent = data.transcript;

    panelLoading.classList.add('hidden');
    panelResult.classList.remove('hidden');
    setStep(2);

  } catch (err) {
    showError(err.message);
  }
});

// ===== Step 2 -> Step 3: Generate summary + quiz (REAL backend call) =====
toQuizBtn.addEventListener('click', async () => {
  showLoader('Generating summary and quiz with AI...');

  try {
    const response = await fetch(BACKEND_URL + '/api/generate/' + currentVideoId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: currentTranscript }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    currentQuizId = data.quiz_id;
    currentQuestions = data.quiz;
    summaryText.textContent = data.summary;

    renderQuiz(data.quiz);

    panelLoading.classList.add('hidden');
    panelQuiz.classList.remove('hidden');
    setStep(4);

  } catch (err) {
    showError(err.message);
  }
});

// ===== Build quiz question cards dynamically from AI-generated data =====
function renderQuiz(questions) {
  quizContainer.innerHTML = '';

  questions.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'panel-card mb-4 q-card';
    card.dataset.qIndex = index;

    const questionText = document.createElement('p');
    questionText.className = 'text-sm font-medium mb-3';
    questionText.textContent = `${index + 1}. ${q.question}`;
    card.appendChild(questionText);

    q.options.forEach((optionText, optionIndex) => {
      const label = document.createElement('label');
      label.className = 'quiz-option';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'question-' + index;
      input.value = optionIndex;

      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + optionText));
      card.appendChild(label);
    });

    quizContainer.appendChild(card);
  });
}

// ===== Step 3: Submit quiz to backend for scoring (REAL backend call) =====
submitQuizBtn.addEventListener('click', async () => {
  const answers = currentQuestions.map((q, index) => {
    const picked = document.querySelector(`input[name="question-${index}"]:checked`);
    return picked ? parseInt(picked.value) : -1;
  });

  try {
    const response = await fetch(BACKEND_URL + '/api/quiz/' + currentQuizId + '/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Submission failed');
    }

    // highlight correct/incorrect options
    document.querySelectorAll('.q-card').forEach((card) => {
      const qIndex = parseInt(card.dataset.qIndex);
      const correctIndex = currentQuestions[qIndex].correct_index;
      const picked = card.querySelector(`input[name="question-${qIndex}"]:checked`);

      card.querySelectorAll('.quiz-option').forEach((label) => {
        const input = label.querySelector('input');
        if (parseInt(input.value) === correctIndex) label.classList.add('correct');
        if (picked && input === picked && parseInt(input.value) !== correctIndex) {
          label.classList.add('incorrect');
        }
      });
    });

    submitQuizBtn.disabled = true;
    scoreText.textContent = `${data.score} / ${data.total_questions}`;
    panelScore.classList.remove('hidden');

  } catch (err) {
    alert('Error: ' + err.message);
  }
});