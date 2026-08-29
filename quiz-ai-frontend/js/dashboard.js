// ===== Configuration & Global State =====
const BACKEND_URL = 'http://127.0.0.1:5000';

let currentUser = null;
let currentVideoId = null;
let currentTranscript = '';
let currentSummary = '';
let currentQuizId = null;
let currentQuestions = [];
let quizTimerInterval = null;
let quizSecondsElapsed = 0;

// Preferences State
let selectedDifficulty = 'medium';
let selectedQuestionCount = 5;
let selectedSummaryFormat = 'executive'; // 'executive' | 'comprehensive' | 'flashcard'

// Performance & History State
let userHistoryList = [];
let userQuizAttempts = JSON.parse(localStorage.getItem('synapse_quiz_attempts') || '[]');

// ===== Toast Notification Helper =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  
  let icon = 'info';
  if (type === 'success') icon = 'check_circle';
  if (type === 'error') icon = 'error';

  toast.innerHTML = `
    <span class="material-symbols-outlined text-[18px] ${type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-rose-400' : 'text-blue-400'}">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ===== Theme Toggle (Dark / Light Mode) =====
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');

function updateThemeUI() {
  const isDark = document.documentElement.classList.contains('dark');
  if (themeIcon) {
    themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('synapse_theme', 'light');
      showToast('Switched to Light theme', 'info');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('synapse_theme', 'dark');
      showToast('Switched to Dark theme', 'info');
    }
    updateThemeUI();
  });
}

// ===== Auth check =====
async function checkAuth() {
  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  const userAvatarEl = document.getElementById('userAvatar');

  try {
    const response = await fetch(BACKEND_URL + '/api/me', {
      credentials: 'include',
    });

    if (response.ok) {
      currentUser = await response.json();
      const name = currentUser.full_name || 'User';
      if (userNameEl) userNameEl.textContent = name;
      if (userEmailEl) userEmailEl.textContent = currentUser.email || 'user@synapse.app';
      
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
      if (userAvatarEl) userAvatarEl.textContent = initials;
    } else {
      if (userNameEl) userNameEl.textContent = 'Demo Scholar';
      if (userEmailEl) userEmailEl.textContent = 'demo@synapse.app';
      if (userAvatarEl) userAvatarEl.textContent = 'DS';
    }
  } catch (err) {
    if (userNameEl) userNameEl.textContent = 'Guest User';
    if (userEmailEl) userEmailEl.textContent = 'offline@synapse.app';
    if (userAvatarEl) userAvatarEl.textContent = 'GU';
  }
}

// ===== Logout =====
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch(BACKEND_URL + '/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      window.location.href = 'landing.html';
    }
  });
}

// ===== Backend connection check =====
const backendStatus = document.getElementById('backendStatus');
const backendStatusText = document.getElementById('backendStatusText');

function checkBackendHealth() {
  fetch(BACKEND_URL + '/')
    .then((res) => res.json())
    .then((data) => {
      if (backendStatusText) backendStatusText.textContent = 'Service Online';
      if (backendStatus) {
        backendStatus.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800';
        const dot = backendStatus.querySelector('span');
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
      }
    })
    .catch(() => {
      if (backendStatusText) backendStatusText.textContent = 'Backend Offline';
      if (backendStatus) {
        backendStatus.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800';
        const dot = backendStatus.querySelector('span');
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-rose-500';
      }
    });
}

// ===== Tab Navigation =====
const tabBtnStudio = document.getElementById('tabBtn-studio');
const tabBtnHistory = document.getElementById('tabBtn-history');
const tabBtnPerformance = document.getElementById('tabBtn-performance');

const viewStudio = document.getElementById('view-studio');
const viewHistory = document.getElementById('view-history');
const viewPerformance = document.getElementById('view-performance');

function switchTab(targetTab) {
  [tabBtnStudio, tabBtnHistory, tabBtnPerformance].forEach(btn => {
    if (!btn) return;
    btn.className = 'nav-tab flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-150';
    const indicator = btn.querySelector('.rounded-full.bg-blue-600, .rounded-full.bg-blue-400');
    if (indicator) indicator.remove();
  });

  [viewStudio, viewHistory, viewPerformance].forEach(v => {
    if (v) v.classList.add('hidden');
  });

  if (targetTab === 'studio') {
    tabBtnStudio.className = 'nav-tab active flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm shadow-blue-500/5';
    if (!tabBtnStudio.querySelector('.rounded-full')) {
      const dot = document.createElement('span');
      dot.className = 'w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400';
      tabBtnStudio.appendChild(dot);
    }
    viewStudio.classList.remove('hidden');
  } else if (targetTab === 'history') {
    tabBtnHistory.className = 'nav-tab active flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm shadow-blue-500/5';
    viewHistory.classList.remove('hidden');
    loadUserHistory();
  } else if (targetTab === 'performance') {
    tabBtnPerformance.className = 'nav-tab active flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm shadow-blue-500/5';
    viewPerformance.classList.remove('hidden');
    loadUserPerformance();
  }

  closeMobileSidebar();
}

if (tabBtnStudio) tabBtnStudio.addEventListener('click', () => switchTab('studio'));
if (tabBtnHistory) tabBtnHistory.addEventListener('click', () => switchTab('history'));
if (tabBtnPerformance) tabBtnPerformance.addEventListener('click', () => switchTab('performance'));

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarNav = document.getElementById('sidebarNav');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openMobileSidebar() {
  sidebarNav.classList.remove('-translate-x-full');
  sidebarOverlay.classList.remove('hidden');
}

function closeMobileSidebar() {
  if (sidebarNav) sidebarNav.classList.add('-translate-x-full');
  if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
}

if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

// ===== Studio Elements =====
const processBtn = document.getElementById('processBtn');
const toQuizBtn = document.getElementById('toQuizBtn');
const submitQuizBtn = document.getElementById('submitQuizBtn');
const backToSummaryBtn = document.getElementById('backToSummaryBtn');
const retakeQuizBtn = document.getElementById('retakeQuizBtn');
const newVideoBtn = document.getElementById('newVideoBtn');

const panelUpload = document.getElementById('panel-upload');
const panelLoading = document.getElementById('panel-loading');
const panelResult = document.getElementById('panel-result');
const panelQuiz = document.getElementById('panel-quiz');
const panelScore = document.getElementById('panel-score');

const loaderText = document.getElementById('loaderText');
const loaderTitle = document.getElementById('loaderTitle');
const loaderProgressBar = document.getElementById('loaderProgressBar');
const scoreText = document.getElementById('scoreText');
const scoreFeedback = document.getElementById('scoreFeedback');
const scoreBadgeIcon = document.getElementById('scoreBadgeIcon');
const transcriptText = document.getElementById('transcriptText');
const summaryText = document.getElementById('summaryText');
const quizContainer = document.getElementById('quizContainer');
const ytLinkInput = document.getElementById('ytLink');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dropZoneText = document.getElementById('dropZoneText');
const pasteLinkBtn = document.getElementById('pasteLinkBtn');
const quickSampleBtn = document.getElementById('quickSampleBtn');

// Quiz Settings Controls
const questionSlider = document.getElementById('questionSlider');
const questionCountDisplay = document.getElementById('questionCountDisplay');
const diffButtons = document.querySelectorAll('.diff-btn');
const presetCountButtons = document.querySelectorAll('.preset-count-btn');
const summaryFormatButtons = document.querySelectorAll('.summary-format-btn');
const quizBannerMeta = document.getElementById('quizBannerMeta');

// Summary Format Style Selection
summaryFormatButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    summaryFormatButtons.forEach(b => {
      b.className = 'summary-format-btn p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-left transition-all';
      b.classList.remove('active');
    });
    btn.classList.add('active');
    btn.className = 'summary-format-btn active p-3.5 rounded-xl border-2 border-blue-600 bg-blue-50/60 dark:bg-blue-900/30 text-left transition-all';
    selectedSummaryFormat = btn.dataset.format;
    showToast(`Format set to ${btn.querySelector('p').textContent.trim()}`, 'info');
  });
});

// Difficulty Selection
diffButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    diffButtons.forEach(b => {
      b.className = 'diff-btn flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-center';
      b.classList.remove('active');
    });
    btn.classList.add('active');
    selectedDifficulty = btn.dataset.diff;

    if (selectedDifficulty === 'easy') {
      btn.className = 'diff-btn active flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/30 shadow-sm text-center';
    } else if (selectedDifficulty === 'hard') {
      btn.className = 'diff-btn active flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-rose-500 bg-rose-50/60 dark:bg-rose-900/30 shadow-sm text-center';
    } else {
      btn.className = 'diff-btn active flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-blue-600 bg-blue-50/60 dark:bg-blue-900/30 shadow-sm text-center';
    }

    updateQuizBannerMeta();
  });
});

// Question Count Slider & Presets
function setQuestionCount(count) {
  selectedQuestionCount = parseInt(count, 10);
  if (questionSlider) questionSlider.value = selectedQuestionCount;
  if (questionCountDisplay) questionCountDisplay.textContent = `${selectedQuestionCount} Questions`;
  
  presetCountButtons.forEach(b => {
    if (parseInt(b.dataset.count, 10) === selectedQuestionCount) {
      b.className = 'preset-count-btn px-2.5 py-1 text-xs font-bold rounded-lg border border-blue-400 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300';
    } else {
      b.className = 'preset-count-btn px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
    }
  });

  updateQuizBannerMeta();
}

if (questionSlider) {
  questionSlider.addEventListener('input', (e) => {
    setQuestionCount(e.target.value);
  });
}

presetCountButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    setQuestionCount(btn.dataset.count);
  });
});

function updateQuizBannerMeta() {
  if (quizBannerMeta) {
    const diffLabel = selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
    quizBannerMeta.textContent = `${selectedQuestionCount} Questions • ${diffLabel} Difficulty • Instant Explanations`;
  }
}

// Paste Link Helper
if (pasteLinkBtn) {
  pasteLinkBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        ytLinkInput.value = text;
        fileInput.value = '';
        dropZoneText.textContent = 'Click to upload video file or drag and drop here';
        showToast('Link pasted from clipboard', 'success');
      }
    } catch (e) {
      ytLinkInput.focus();
    }
  });
}

// Quick Sample Video
if (quickSampleBtn) {
  quickSampleBtn.addEventListener('click', () => {
    ytLinkInput.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    fileInput.value = '';
    dropZoneText.textContent = 'Click to upload video file or drag and drop here';
    showToast('Loaded sample video link', 'info');
  });
}

// Drag & drop file handling
if (fileInput) {
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      dropZoneText.textContent = 'Selected: ' + fileInput.files[0].name;
      ytLinkInput.value = '';
      showToast('Video file selected', 'info');
    }
  });
}

if (dropZone) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-blue-500', 'bg-blue-50/50');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
    if (e.dataTransfer.files[0]) {
      fileInput.files = e.dataTransfer.files;
      dropZoneText.textContent = 'Selected: ' + e.dataTransfer.files[0].name;
      ytLinkInput.value = '';
      showToast('Video file attached', 'info');
    }
  });
}

if (ytLinkInput) {
  ytLinkInput.addEventListener('input', () => {
    if (ytLinkInput.value.trim()) {
      fileInput.value = '';
      dropZoneText.textContent = 'Click to upload video file or drag and drop here';
    }
  });
}

// Pipeline Stepper Progress Rail
function setPipelineStep(activeStep) {
  document.querySelectorAll('.rail-step').forEach((el) => {
    const step = parseInt(el.dataset.step, 10);
    const badge = el.querySelector('.rail-step-badge');

    badge.classList.remove('active', 'done');

    if (step < activeStep) {
      badge.classList.add('done');
      badge.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span>';
    } else if (step === activeStep) {
      badge.classList.add('active');
      badge.textContent = step;
    } else {
      badge.textContent = step;
    }
  });
}

function showLoader(title, message, progressPct = 30) {
  panelUpload.classList.add('hidden');
  panelResult.classList.add('hidden');
  panelQuiz.classList.add('hidden');
  panelScore.classList.add('hidden');
  panelLoading.classList.remove('hidden');

  if (loaderTitle) loaderTitle.textContent = title;
  if (loaderText) loaderText.textContent = message;
  if (loaderProgressBar) loaderProgressBar.style.width = progressPct + '%';
}

function showError(message) {
  panelLoading.classList.add('hidden');
  panelUpload.classList.remove('hidden');
  showToast(message, 'error');
}

// ===== Format AI Summary for Clean Visual Output =====
function formatAISummary(rawSummary) {
  if (!rawSummary) return '<p class="text-slate-400 italic">No summary generated yet.</p>';
  
  const lines = rawSummary.split('\n');
  let formatted = '';
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { formatted += '</ul>'; inList = false; }
      return;
    }

    if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      if (inList) { formatted += '</ul>'; inList = false; }
      const cleanTitle = trimmed.replace(/^#+\s*/, '');
      formatted += `<h4 class="font-bold text-slate-900 dark:text-white text-base mt-4 mb-2 flex items-center gap-2"><span class="w-1.5 h-4 bg-blue-600 rounded"></span>${cleanTitle}</h4>`;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      if (!inList) { formatted += '<ul class="list-disc list-inside space-y-1.5 my-2 text-slate-700 dark:text-slate-300">'; inList = true; }
      const content = trimmed.replace(/^[-*•]\s*/, '');
      formatted += `<li class="leading-relaxed"><span class="font-medium text-slate-800 dark:text-slate-100">${content}</span></li>`;
    } else {
      if (inList) { formatted += '</ul>'; inList = false; }
      formatted += `<p class="mb-3 text-slate-700 dark:text-slate-300 leading-relaxed">${trimmed}</p>`;
    }
  });

  if (inList) formatted += '</ul>';
  return formatted;
}

// ===== Process Video (Step 1 -> Step 2 & Step 3) =====
if (processBtn) {
  processBtn.addEventListener('click', async () => {
    const youtubeUrl = ytLinkInput.value.trim();
    const file = fileInput.files[0];

    if (!youtubeUrl && !file) {
      showToast('Please provide a YouTube URL or choose a video file', 'error');
      return;
    }

    showLoader('Analyzing Audio & Transcription', 'Extracting audio track and synthesizing speech to text...', 35);

    try {
      let response;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        response = await fetch(BACKEND_URL + '/api/process', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
      } else {
        response = await fetch(BACKEND_URL + '/api/process', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtube_url: youtubeUrl }),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Video processing failed');
      }

      currentVideoId = data.video_id;
      currentTranscript = data.transcript || '';

      const titleEl = document.getElementById('resultVideoTitle');
      if (titleEl) titleEl.textContent = data.title || 'Processed Video Analysis';

      // Calculate stats
      const wordCount = currentTranscript.split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 200));
      const wordCountEl = document.getElementById('resultWordCount');
      const readTimeEl = document.getElementById('resultReadTime');
      if (wordCountEl) wordCountEl.textContent = `~${wordCount.toLocaleString()} words`;
      if (readTimeEl) readTimeEl.textContent = `${readTime} min read`;

      if (transcriptText) transcriptText.textContent = currentTranscript;

      // Advance to generate summary & quiz with user preferences
      if (loaderTitle) loaderTitle.textContent = 'Generating AI Summary & Quiz';
      if (loaderText) loaderText.textContent = `Synthesizing ${selectedQuestionCount} questions (${selectedDifficulty}) in ${selectedSummaryFormat} style...`;
      if (loaderProgressBar) loaderProgressBar.style.width = '75%';

      const genResponse = await fetch(BACKEND_URL + '/api/generate/' + currentVideoId, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: currentTranscript,
          difficulty: selectedDifficulty,
          num_questions: selectedQuestionCount,
          summary_format: selectedSummaryFormat
        }),
      });

      const genData = await genResponse.json();
      if (!genResponse.ok) {
        throw new Error(genData.error || 'AI generation failed');
      }

      currentQuizId = genData.quiz_id;
      currentQuestions = genData.quiz || [];
      currentSummary = genData.summary || '';

      if (summaryText) summaryText.innerHTML = formatAISummary(currentSummary);

      panelLoading.classList.add('hidden');
      panelResult.classList.remove('hidden');
      setPipelineStep(3);
      showToast('Summary & Quiz successfully generated!', 'success');

      loadUserHistory();

    } catch (err) {
      showError(err.message);
    }
  });
}

// ===== Result Tabs =====
const tabResultSummary = document.getElementById('tabResultSummary');
const tabResultTranscript = document.getElementById('tabResultTranscript');
const contentSummary = document.getElementById('contentSummary');
const contentTranscript = document.getElementById('contentTranscript');

if (tabResultSummary && tabResultTranscript) {
  tabResultSummary.addEventListener('click', () => {
    tabResultSummary.className = 'py-2.5 font-bold text-sm text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 flex items-center gap-2';
    tabResultTranscript.className = 'py-2.5 font-semibold text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-b-2 border-transparent flex items-center gap-2';
    contentSummary.classList.remove('hidden');
    contentTranscript.classList.add('hidden');
  });

  tabResultTranscript.addEventListener('click', () => {
    tabResultTranscript.className = 'py-2.5 font-bold text-sm text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 flex items-center gap-2';
    tabResultSummary.className = 'py-2.5 font-semibold text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-b-2 border-transparent flex items-center gap-2';
    contentTranscript.classList.remove('hidden');
    contentSummary.classList.add('hidden');
  });
}

// Copy Summary Action
const copySummaryBtn = document.getElementById('copySummaryBtn');
if (copySummaryBtn) {
  copySummaryBtn.addEventListener('click', async () => {
    if (!currentSummary) return;
    try {
      await navigator.clipboard.writeText(currentSummary);
      showToast('Summary copied to clipboard', 'success');
    } catch (e) {
      showToast('Failed to copy', 'error');
    }
  });
}

// Text to Speech Read Aloud
const ttsBtn = document.getElementById('ttsBtn');
let isSpeaking = false;

if (ttsBtn) {
  ttsBtn.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech not supported on this browser', 'error');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      ttsBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">volume_up</span> Listen';
      return;
    }

    if (!currentSummary) return;
    const cleanText = currentSummary.replace(/[#*_-]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => {
      isSpeaking = false;
      ttsBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">volume_up</span> Listen';
    };

    window.speechSynthesis.speak(utterance);
    isSpeaking = true;
    ttsBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] text-blue-600">stop_circle</span> Stop Audio';
  });
}

// Download Summary
const downloadSummaryBtn = document.getElementById('downloadSummaryBtn');
if (downloadSummaryBtn) {
  downloadSummaryBtn.addEventListener('click', () => {
    if (!currentSummary) return;
    const blob = new Blob([currentSummary], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Summary-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Summary exported as Markdown', 'success');
  });
}

// Search inside Transcript
const transcriptSearchInput = document.getElementById('transcriptSearchInput');
if (transcriptSearchInput) {
  transcriptSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      transcriptText.textContent = currentTranscript;
      return;
    }
    const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    const highlighted = currentTranscript.replace(regex, '<mark class="bg-amber-200 dark:bg-amber-800 text-slate-900 dark:text-white rounded px-1">$1</mark>');
    transcriptText.innerHTML = highlighted;
  });
}

// ===== Interactive Quiz Flow =====
function startQuizTimer() {
  clearInterval(quizTimerInterval);
  quizSecondsElapsed = 0;
  const timerEl = document.getElementById('quizTimer');
  if (timerEl) timerEl.textContent = '00:00';

  quizTimerInterval = setInterval(() => {
    quizSecondsElapsed++;
    const mins = Math.floor(quizSecondsElapsed / 60).toString().padStart(2, '0');
    const secs = (quizSecondsElapsed % 60).toString().padStart(2, '0');
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopQuizTimer() {
  clearInterval(quizTimerInterval);
}

if (toQuizBtn) {
  toQuizBtn.addEventListener('click', () => {
    if (!currentQuestions || currentQuestions.length === 0) {
      showToast('No quiz available for this video', 'error');
      return;
    }

    renderQuizCards(currentQuestions);
    panelResult.classList.add('hidden');
    panelScore.classList.add('hidden');
    panelQuiz.classList.remove('hidden');
    setPipelineStep(4);
    startQuizTimer();
  });
}

if (backToSummaryBtn) {
  backToSummaryBtn.addEventListener('click', () => {
    stopQuizTimer();
    panelQuiz.classList.add('hidden');
    panelResult.classList.remove('hidden');
    setPipelineStep(3);
  });
}

// Render Quiz Questions
function renderQuizCards(questions) {
  if (!quizContainer) return;
  quizContainer.innerHTML = '';

  const progressText = document.getElementById('quizProgressText');
  if (progressText) progressText.textContent = `Assessment: ${questions.length} questions (${selectedDifficulty} level)`;

  questions.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'soft-card p-6 rounded-2xl flex flex-col gap-4 q-card bg-white dark:bg-slate-900';
    card.dataset.qIndex = index;

    const header = document.createElement('div');
    header.className = 'flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3';

    const qNum = document.createElement('span');
    qNum.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300';
    qNum.textContent = `Q${index + 1}`;

    const qTitle = document.createElement('h4');
    qTitle.className = 'flex-1 font-bold text-slate-900 dark:text-white text-sm md:text-base leading-snug';
    qTitle.textContent = q.question;

    header.appendChild(qNum);
    header.appendChild(qTitle);
    card.appendChild(header);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'flex flex-col gap-2.5 pt-1';

    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((optText, optIndex) => {
      const choiceLabel = document.createElement('label');
      choiceLabel.className = 'quiz-choice-item flex items-center gap-3 p-3.5 rounded-xl cursor-pointer';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `question-${index}`;
      input.value = optIndex;
      input.className = 'hidden';

      const badge = document.createElement('span');
      badge.className = 'w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 choice-badge';
      badge.textContent = letters[optIndex] || (optIndex + 1);

      const spanText = document.createElement('span');
      spanText.className = 'text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 flex-1';
      spanText.textContent = optText;

      choiceLabel.appendChild(input);
      choiceLabel.appendChild(badge);
      choiceLabel.appendChild(spanText);

      choiceLabel.addEventListener('click', () => {
        optionsContainer.querySelectorAll('.quiz-choice-item').forEach(el => {
          el.classList.remove('selected');
          const b = el.querySelector('.choice-badge');
          if (b) {
            b.className = 'w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 choice-badge';
          }
        });

        choiceLabel.classList.add('selected');
        badge.className = 'w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center border border-blue-600 choice-badge';
      });

      optionsContainer.appendChild(choiceLabel);
    });

    card.appendChild(optionsContainer);
    quizContainer.appendChild(card);
  });

  if (submitQuizBtn) submitQuizBtn.disabled = false;
}

// Submit Quiz & Show Explanations
if (submitQuizBtn) {
  submitQuizBtn.addEventListener('click', async () => {
    stopQuizTimer();

    const answers = currentQuestions.map((q, index) => {
      const picked = document.querySelector(`input[name="question-${index}"]:checked`);
      return picked ? parseInt(picked.value, 10) : -1;
    });

    const unanswered = answers.filter(a => a === -1).length;
    if (unanswered > 0) {
      const proceed = confirm(`You have ${unanswered} unanswered question(s). Do you want to submit anyway?`);
      if (!proceed) {
        startQuizTimer();
        return;
      }
    }

    try {
      let score = 0;
      let totalQuestions = currentQuestions.length;

      const response = await fetch(BACKEND_URL + '/api/quiz/' + currentQuizId + '/submit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (response.ok) {
        const data = await response.json();
        score = data.score;
        totalQuestions = data.total_questions;
      } else {
        currentQuestions.forEach((q, idx) => {
          if (answers[idx] === q.correct_index) score++;
        });
      }

      // Highlight correct & incorrect answers + append Explanations
      const letters = ['A', 'B', 'C', 'D'];
      document.querySelectorAll('.q-card').forEach((card) => {
        const qIndex = parseInt(card.dataset.qIndex, 10);
        const q = currentQuestions[qIndex];
        const correctIdx = q.correct_index;
        const picked = card.querySelector(`input[name="question-${qIndex}"]:checked`);
        const pickedValue = picked ? parseInt(picked.value, 10) : -1;

        card.querySelectorAll('.quiz-choice-item').forEach((label) => {
          const input = label.querySelector('input');
          const val = parseInt(input.value, 10);

          if (val === correctIdx) {
            label.classList.add('correct');
            const b = label.querySelector('.choice-badge');
            if (b) b.className = 'w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center';
          } else if (val === pickedValue && pickedValue !== correctIdx) {
            label.classList.add('incorrect');
            const b = label.querySelector('.choice-badge');
            if (b) b.className = 'w-6 h-6 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center justify-center';
          }
        });

        // Add Explanation box if not already present
        if (!card.querySelector('.explanation-box')) {
          const explanationBox = document.createElement('div');
          explanationBox.className = 'explanation-box';
          const correctLetter = letters[correctIdx] || (correctIdx + 1);
          const correctText = q.options[correctIdx];
          const explanationText = q.explanation || `Correct Answer: Option ${correctLetter} ("${correctText}"). This concept is established in the lecture transcript.`;

          explanationBox.innerHTML = `
            <div class="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400 mb-1">
              <span class="material-symbols-outlined text-[16px]">lightbulb</span>
              <span>AI Explanation:</span>
            </div>
            <p class="text-slate-700 dark:text-slate-300">${explanationText}</p>
          `;
          card.appendChild(explanationBox);
        }
      });

      submitQuizBtn.disabled = true;

      // Record attempt for Performance Dashboard
      const attemptData = {
        videoTitle: document.getElementById('resultVideoTitle')?.textContent || 'Video Quiz',
        score,
        totalQuestions,
        difficulty: selectedDifficulty,
        date: new Date().toISOString()
      };
      userQuizAttempts.unshift(attemptData);
      localStorage.setItem('synapse_quiz_attempts', JSON.stringify(userQuizAttempts.slice(0, 50)));

      // Render Score Panel
      const percentage = Math.round((score / totalQuestions) * 100);
      if (scoreText) scoreText.textContent = `${score} / ${totalQuestions}`;

      if (percentage >= 80) {
        if (scoreBadgeIcon) scoreBadgeIcon.textContent = '🏆';
        if (scoreFeedback) {
          scoreFeedback.textContent = `Outstanding! ${percentage}% mastery score achieved!`;
          scoreFeedback.className = 'text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-2';
        }
      } else if (percentage >= 50) {
        if (scoreBadgeIcon) scoreBadgeIcon.textContent = '🎯';
        if (scoreFeedback) {
          scoreFeedback.textContent = `Good effort! ${percentage}% score. Review the explanations below.`;
          scoreFeedback.className = 'text-sm font-semibold text-blue-600 dark:text-blue-400 mt-2';
        }
      } else {
        if (scoreBadgeIcon) scoreBadgeIcon.textContent = '💡';
        if (scoreFeedback) {
          scoreFeedback.textContent = `Keep practicing! Review the summary notes and retake the quiz.`;
          scoreFeedback.className = 'text-sm font-semibold text-amber-600 dark:text-amber-400 mt-2';
        }
      }

      panelScore.classList.remove('hidden');
      panelScore.scrollIntoView({ behavior: 'smooth' });
      showToast(`Quiz completed! You scored ${score}/${totalQuestions}`, 'success');

    } catch (err) {
      showToast('Error submitting quiz: ' + err.message, 'error');
    }
  });
}

// Retake Quiz
if (retakeQuizBtn) {
  retakeQuizBtn.addEventListener('click', () => {
    panelScore.classList.add('hidden');
    renderQuizCards(currentQuestions);
    startQuizTimer();
    panelQuiz.scrollIntoView({ behavior: 'smooth' });
  });
}

// New Video action
if (newVideoBtn) {
  newVideoBtn.addEventListener('click', () => {
    panelScore.classList.add('hidden');
    panelQuiz.classList.add('hidden');
    panelResult.classList.add('hidden');
    panelUpload.classList.remove('hidden');
    setPipelineStep(1);
    ytLinkInput.value = '';
    fileInput.value = '';
    dropZoneText.textContent = 'Click to upload video file or drag and drop here';
  });
}

// ===== HISTORY SECTION (With Direct Quiz Practice) =====
async function loadUserHistory() {
  const container = document.getElementById('historyListContainer');
  const emptyState = document.getElementById('historyEmptyState');
  const badge = document.getElementById('historyCountBadge');
  if (!container) return;

  try {
    const response = await fetch(BACKEND_URL + '/api/history', {
      credentials: 'include',
    });

    if (response.ok) {
      userHistoryList = await response.json();
    } else {
      userHistoryList = [];
    }
  } catch (err) {
    userHistoryList = [];
  }

  if (badge) badge.textContent = userHistoryList.length;

  if (userHistoryList.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  renderHistoryCards(userHistoryList);
}

function renderHistoryCards(items) {
  const container = document.getElementById('historyListContainer');
  if (!container) return;
  container.innerHTML = '';

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'soft-card p-5 rounded-2xl flex flex-col justify-between gap-4 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all';

    const topSection = document.createElement('div');
    topSection.className = 'flex flex-col gap-2.5';

    const metaRow = document.createElement('div');
    metaRow.className = 'flex items-center justify-between';

    const sourceBadge = document.createElement('span');
    sourceBadge.className = 'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ' + 
      (item.source_type === 'youtube' ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300');
    sourceBadge.textContent = item.source_type === 'youtube' ? 'YouTube' : 'Uploaded';

    const dateFormatted = item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
    const dateSpan = document.createElement('span');
    dateSpan.className = 'text-[11px] text-slate-400 font-medium';
    dateSpan.textContent = dateFormatted;

    metaRow.appendChild(sourceBadge);
    metaRow.appendChild(dateSpan);

    const titleEl = document.createElement('h4');
    titleEl.className = 'font-bold text-slate-900 dark:text-white text-sm line-clamp-1';
    titleEl.textContent = item.title || 'Untitled Video Summary';

    const previewEl = document.createElement('p');
    previewEl.className = 'text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed';
    previewEl.textContent = item.summary_text ? item.summary_text.replace(/[#*_-]/g, '').trim() : 'Transcript extracted. Ready for review.';

    topSection.appendChild(metaRow);
    topSection.appendChild(titleEl);
    topSection.appendChild(previewEl);

    // Actions
    const actionRow = document.createElement('div');
    actionRow.className = 'flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800';

    const leftBtns = document.createElement('div');
    leftBtns.className = 'flex items-center gap-2';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1';
    viewBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">visibility</span> Summary';
    viewBtn.addEventListener('click', () => {
      openSummaryModal(item.title, item.summary_text, dateFormatted);
    });

    const quizBtn = document.createElement('button');
    quizBtn.className = 'px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1';
    quizBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">quiz</span> Practice Quiz';
    quizBtn.addEventListener('click', async () => {
      // Launch practice quiz for this history item
      showToast('Loading quiz session...', 'info');
      currentVideoId = item.video_id;
      currentSummary = item.summary_text || '';
      
      switchTab('studio');
      panelUpload.classList.add('hidden');
      panelLoading.classList.add('hidden');
      panelScore.classList.add('hidden');

      const titleHeader = document.getElementById('resultVideoTitle');
      if (titleHeader) titleHeader.textContent = item.title || 'Video Quiz Practice';
      if (summaryText) summaryText.innerHTML = formatAISummary(currentSummary);

      // If we have questions or need to generate fallback quiz
      if (!currentQuestions || currentQuestions.length === 0) {
        currentQuestions = [
          { question: `What is the central focus discussed in "${item.title || 'this video'}"?`, options: ['Main subject concepts', 'Unrelated trivia', 'Historical anecdotes only', 'Introduction without core concepts'], correct_index: 0, explanation: 'The video centers around core principles detailed in the summary.' },
          { question: 'Which methodology was highlighted in the synthesis?', options: ['Step-by-step framework', 'Random trial approach', 'Manual calculation exclusively', 'No systematic method'], correct_index: 0, explanation: 'A structured, systematic approach is emphasized in the takeaways.' },
          { question: 'What is a key takeaway for applying this topic?', options: ['Consistent active practice', 'Passive memorization', 'Skipping fundamental concepts', 'Avoiding review'], correct_index: 0, explanation: 'Active recall and structured application produce optimal retention.' }
        ];
      }

      renderQuizCards(currentQuestions);
      panelQuiz.classList.remove('hidden');
      setPipelineStep(4);
      startQuizTimer();
    });

    leftBtns.appendChild(viewBtn);
    leftBtns.appendChild(quizBtn);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800';
    copyBtn.title = 'Copy summary';
    copyBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">content_copy</span>';
    copyBtn.addEventListener('click', async () => {
      if (item.summary_text) {
        await navigator.clipboard.writeText(item.summary_text);
        showToast('Summary copied to clipboard', 'success');
      }
    });

    actionRow.appendChild(leftBtns);
    actionRow.appendChild(copyBtn);

    card.appendChild(topSection);
    card.appendChild(actionRow);
    container.appendChild(card);
  });
}

// History Search filter
const historySearchInput = document.getElementById('historySearchInput');
if (historySearchInput) {
  historySearchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderHistoryCards(userHistoryList);
      return;
    }
    const filtered = userHistoryList.filter(item => 
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.summary_text && item.summary_text.toLowerCase().includes(q))
    );
    renderHistoryCards(filtered);
  });
}

const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
if (refreshHistoryBtn) {
  refreshHistoryBtn.addEventListener('click', () => {
    loadUserHistory();
    showToast('History refreshed', 'info');
  });
}

const historyGoStudioBtn = document.getElementById('historyGoStudioBtn');
if (historyGoStudioBtn) {
  historyGoStudioBtn.addEventListener('click', () => switchTab('studio'));
}

// ===== Summary Modal Logic =====
const summaryModal = document.getElementById('summaryModal');
const modalTitle = document.getElementById('modalTitle');
const modalSummaryContent = document.getElementById('modalSummaryContent');
const modalDate = document.getElementById('modalDate');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalCloseBtn2 = document.getElementById('modalCloseBtn2');
const modalCopyBtn = document.getElementById('modalCopyBtn');

let activeModalSummary = '';

function openSummaryModal(title, summary, date) {
  if (!summaryModal) return;
  activeModalSummary = summary || '';
  if (modalTitle) modalTitle.textContent = title || 'Video Summary';
  if (modalDate) modalDate.textContent = `Generated on ${date || 'Recent'}`;
  if (modalSummaryContent) modalSummaryContent.innerHTML = formatAISummary(summary);
  summaryModal.classList.remove('hidden');
}

function closeSummaryModal() {
  if (summaryModal) summaryModal.classList.add('hidden');
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeSummaryModal);
if (modalCloseBtn2) modalCloseBtn2.addEventListener('click', closeSummaryModal);
if (summaryModal) {
  summaryModal.addEventListener('click', (e) => {
    if (e.target === summaryModal) closeSummaryModal();
  });
}

if (modalCopyBtn) {
  modalCopyBtn.addEventListener('click', async () => {
    if (activeModalSummary) {
      await navigator.clipboard.writeText(activeModalSummary);
      showToast('Summary copied from modal', 'success');
    }
  });
}

// ===== PERFORMANCE DASHBOARD LOGIC =====
async function loadUserPerformance() {
  const statTotalQuizzes = document.getElementById('statTotalQuizzes');
  const statAvgAccuracy = document.getElementById('statAvgAccuracy');
  const statStreak = document.getElementById('statStreak');
  const statBestScore = document.getElementById('statBestScore');
  const recentTableBody = document.getElementById('recentAttemptsTableBody');

  try {
    const response = await fetch(BACKEND_URL + '/api/performance', {
      credentials: 'include',
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Failed to load performance data');

    if (statTotalQuizzes) statTotalQuizzes.textContent = data.total_quizzes;
    if (statAvgAccuracy) statAvgAccuracy.textContent = `${data.avg_accuracy}%`;
    if (statStreak) statStreak.textContent = `${data.streak_days} Day${data.streak_days === 1 ? '' : 's'}`;
    if (statBestScore) statBestScore.textContent = data.best_score !== null ? `${data.best_score}%` : '—';

    ['easy', 'medium', 'hard'].forEach((level) => {
      const label = level.charAt(0).toUpperCase() + level.slice(1);
      const acc = document.getElementById('acc' + label);
      const bar = document.getElementById('bar' + label);
      const val = data.accuracy_by_difficulty[level];
      if (acc) acc.textContent = val !== null ? `${val}%` : 'No data';
      if (bar) bar.style.width = val !== null ? `${val}%` : '0%';
    });

    if (recentTableBody) {
      if (data.recent_attempts.length === 0) {
        recentTableBody.innerHTML = `
          <tr><td colspan="5" class="py-6 text-center text-slate-400">No quizzes completed yet. Complete a quiz to view your score breakdown.</td></tr>
        `;
      } else {
        recentTableBody.innerHTML = '';
        data.recent_attempts.forEach(att => {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors';

          const pct = Math.round((att.score / att.total_questions) * 100);
          const statusBadge = pct >= 60
            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">Mastered</span>'
            : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">Review</span>';

          tr.innerHTML = `
            <td class="py-3 font-semibold text-slate-800 dark:text-slate-200">${att.video_title || 'Video Quiz'}</td>
            <td class="py-3 text-slate-500 dark:text-slate-400">${new Date(att.date).toLocaleDateString()}</td>
            <td class="py-3"><span class="capitalize font-medium text-slate-600 dark:text-slate-300">${att.difficulty || 'medium'}</span></td>
            <td class="py-3 font-bold text-slate-900 dark:text-white">${att.score} / ${att.total_questions} (${pct}%)</td>
            <td class="py-3 text-right">${statusBadge}</td>
          `;
          recentTableBody.appendChild(tr);
        });
      }
    }
  } catch (err) {
    console.error('Failed to load performance:', err);
  }
}

// ===== Initial App Boot =====
window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  checkBackendHealth();
  updateQuizBannerMeta();
  updateThemeUI();
  loadUserHistory();
});