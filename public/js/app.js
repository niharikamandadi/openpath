//const GEMINI_API_KEY = 'AQ.Ab8RN6LCW3kTkMxDoW-MzhHyocAmuGYNPMDSQezbjbJHg5NlSQ';

let currentLang = '';
let allIssues = [];

async function fetchIssues(lang, keyword = '') {
  const grid = document.getElementById('issuesGrid');
  const label = document.getElementById('sectionLabel');

  grid.innerHTML = '<div class="loading">⚡ Fetching real issues from GitHub...</div>';

  let query = 'label:"good first issue"';
  if (lang) query += ` language:${lang}`;
  if (keyword) query += ` ${keyword}`;

  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=created&order=desc&per_page=12`;

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">😕</div><p>No issues found. Try a different language or keyword.</p></div>';
      return;
    }

    allIssues = data.items;

    document.getElementById('totalIssues').textContent = data.total_count.toLocaleString() + '+';
    const repos = new Set(data.items.map(i => i.repository_url));
    document.getElementById('totalRepos').textContent = repos.size;

    label.textContent = `Showing ${data.items.length} real issues · ${lang || 'all languages'} · good first issue`;

    renderIssues(data.items);

  } catch (err) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>GitHub API rate limit hit. Wait a minute and try again.</p></div>';
  }
}

function renderIssues(issues) {
  const grid = document.getElementById('issuesGrid');
  grid.innerHTML = '';

  issues.forEach((issue, index) => {
    const repoName = issue.repository_url.replace('https://api.github.com/repos/', '');
    const initials = repoName.split('/')[0].substring(0, 2).toUpperCase();
    const labels = issue.labels || [];

    const tagHTML = labels.slice(0, 3).map(l => {
      let cls = 'tag';
      if (l.name.includes('good first') || l.name.includes('beginner')) cls += ' green';
      else if (l.name.includes('help') || l.name.includes('feature')) cls += ' orange';
      else cls += ' blue';
      return `<span class="${cls}">${l.name}</span>`;
    }).join('');

    const card = document.createElement('div');
    card.className = 'issue-card';
    card.innerHTML = `
      <div class="card-top">
        <div class="repo-avatar">${initials}</div>
        <div class="repo-name">${repoName}</div>
      </div>
      <div class="card-title">${issue.title}</div>
      <div class="card-tags">
        ${tagHTML}
      </div>
      <div class="card-footer">
        <div class="stars">⭐ ${issue.reactions?.['+1'] || 0} · 💬 ${issue.comments}</div>
        <div style="display:flex; gap:8px;">
          <a href="${issue.html_url}" target="_blank" class="ai-btn" style="text-decoration:none;">View on GitHub</a>
          <button class="ai-btn" onclick="explainIssue(${index})">✦ Explain</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterLang(btn, lang) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  currentLang = lang;
  fetchIssues(lang);
}

function filterDiff(btn, difficulty) {
  document.querySelectorAll('.diff-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  fetchIssues(currentLang, difficulty);
}

function searchIssues() {
  const keyword = document.getElementById('searchInput').value.trim();
  fetchIssues(currentLang, keyword);
}

document.getElementById('searchInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') searchIssues();
});

async function explainIssue(index) {
  const issue = allIssues[index];
  const panel = document.getElementById('aiPanel');
  const aiText = document.getElementById('aiText');
  const aiSkills = document.getElementById('aiSkills');
  const aiLearn = document.getElementById('aiLearn');
  const title = document.getElementById('aiPanelTitle');

  panel.style.display = 'block';
  title.textContent = 'Gemini AI is explaining this issue...';
  aiText.textContent = 'Loading...';
  aiSkills.innerHTML = '';
  aiLearn.textContent = '';

  const prompt = `You are a mentor helping a beginner CS student contribute to open source.

Issue title: "${issue.title}"
Repository: "${issue.repository_url.replace('https://api.github.com/repos/', '')}"
Labels: ${issue.labels.map(l => l.name).join(', ')}

In 3-4 sentences, explain:
1. What this issue is asking someone to fix or build
2. Why it's suitable for a beginner
3. What the student will learn by solving it

Then on a new line write: SKILLS: followed by 3-4 comma separated skills needed.
Then on a new line write: LEARN: followed by one sentence on what they'll gain.

Keep it encouraging and simple.`;

  try {
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    console.log('Gemini response:', data);
    const response = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not get explanation.';

    const lines = response.split('\n').filter(l => l.trim());
    let mainText = '';
    let skills = [];
    let learn = '';

    lines.forEach(line => {
      if (line.startsWith('SKILLS:')) {
        skills = line.replace('SKILLS:', '').split(',').map(s => s.trim());
      } else if (line.startsWith('LEARN:')) {
        learn = line.replace('LEARN:', '').trim();
      } else {
        mainText += line + ' ';
      }
    });

    title.textContent = `✦ AI Explanation · ${issue.repository_url.replace('https://api.github.com/repos/', '').split('/')[1]}`;
    aiText.textContent = mainText.trim();

    aiSkills.innerHTML = skills.map(s => `<span class="skill-pill">${s}</span>`).join('');
    aiLearn.textContent = learn ? `💡 ${learn}` : '';

  } catch (err) {
      aiText.textContent = 'Error: ' + err.message;
      console.error('Gemini error:', err);
    }
}

function closeAiPanel() {
  document.getElementById('aiPanel').style.display = 'none';
}