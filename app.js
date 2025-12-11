document.addEventListener('DOMContentLoaded', () => {
    // --- State & Config ---
    const elements = {
        dateDisplay: document.getElementById('current-date'),
        newsImage: document.getElementById('news-image'),
        newsSource: document.getElementById('news-source'),
        newsTitle: document.getElementById('news-title'),
        newsSummary: document.getElementById('news-summary'),
        newsLink: document.getElementById('news-link'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        feedbackArea: document.getElementById('feedback-area'),
        feedbackTitle: document.getElementById('feedback-title'),
        feedbackText: document.getElementById('feedback-text'),
        archiveBtn: document.getElementById('archive-btn'),
        closeArchive: document.getElementById('close-archive'),
        archiveSidebar: document.getElementById('archive-sidebar'),
        archiveOverlay: document.getElementById('archive-overlay'),
        archiveList: document.getElementById('archive-list')
    };

    // Fallback data for local usage (file:// protocol or missing server)
    const FALLBACK_DATA = [
        {
            "id": "2025-12-11",
            "date": "2025-12-11",
            "source": "CNBC",
            "title": "Case for more Fed rate cuts could rest on 'systemic overcount' of jobs",
            "summary": "Fed Chair Powell suggests job growth may be overstated by 60k/month. If the labor market is actually weaker than official data suggests, the 'data-dependent' Fed may be forced to cut rates more aggressively in 2026 to prevent a recession.",
            "imageUrl": "assets/images/digest_cover.png",
            "articleUrl": "https://www.cnbc.com/2025/12/11/case-for-more-fed-rate-cuts-could-rest-on-systemic-overcount-of-jobs.html",
            "question": "If labor market data is systemically overstated (meaning actual employment is lower than reported), how does this affect the 'Output Gap' variable in a standard Taylor Rule, and what is the policy implication?",
            "options": [
                "The positive output gap is larger, implying rates should be higher to cool the economy.",
                "The output gap is actually more negative (or less positive), implying monetary policy is too tight and rates should comprise.",
                "Labor market errors do not affect the Taylor Rule, which only looks at inflation variance."
            ],
            "correctOption": 1,
            "explanation": "Correct. The Taylor Rule sets rates based on inflation deviation and the Output Gap (difference between actual and potential GDP/Employment). If employment is overstated, the actual economy is weaker (more negative gap) than thought. This calls for a lower interest rate to stimulate demand."
        }
    ];

    // --- Core Logic ---

    // 1. Fetch Data
    async function init() {
        try {
            // Attempt to fetch from JSON file
            const response = await fetch('news.json');
            if (response.ok) {
                newsData = await response.json();
            } else {
                throw new Error('Fetch failed');
            }
        } catch (error) {
            console.warn('Could not fetch news.json (likely due to CORS or offline). Using fallback data.');
            newsData = FALLBACK_DATA;
        }

        initializeUI();
    }

    function initializeUI() {
        try {
            // Sort data by date descending just in case
            newsData.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Determine "Today's" News
            const todayStr = new Date().toISOString().split('T')[0];
            let todaysNews = newsData.find(item => item.date === todayStr);

            if (!todaysNews) {
                // Fallback to the latest one if today hasn't been updated/is weekend
                todaysNews = newsData[0];
            }

            renderDailyDigest(todaysNews);
            renderArchive();

        } catch (error) {
            console.error('Error initializing:', error);
            elements.newsTitle.textContent = "Unable to load digest.";
            elements.newsSummary.textContent = "An error occurred while loading content.";
        }
    }

    // 2. Render Main Digest
    function renderDailyDigest(item) {
        if (!item) return;

        // Date Display
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        elements.dateDisplay.textContent = new Date(item.date).toLocaleDateString('en-US', dateOptions);

        // Content
        // elements.newsImage.src = item.imageUrl; // Disabled dynamic images per user request

        elements.newsImage.onerror = function () {
            // If PNG fails, try JPG
            if (this.src.endsWith('.png')) {
                this.src = 'assets/images/digest_cover.jpg';
            } else {
                console.error("Cover image could not be loaded. Please check it is uploaded to assets/images/digest_cover.png");
                this.style.border = "5px solid red"; // Visual cue for debugging
            }
        };

        elements.newsImage.src = 'assets/images/digest_cover.png'; // Static cover image
        elements.newsSource.textContent = item.source;
        elements.newsTitle.textContent = item.title;
        elements.newsSummary.textContent = item.summary;
        elements.newsLink.href = item.articleUrl;

        // Reset Quiz
        renderQuiz(item);
    }

    // 3. Render Quiz
    function renderQuiz(item) {
        elements.questionText.textContent = item.question;
        elements.optionsContainer.innerHTML = ''; // Clear previous
        elements.feedbackArea.classList.add('hidden'); // Hide feedback

        item.options.forEach((optionText, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = optionText;

            btn.addEventListener('click', () => handleAnswer(index, item, btn));

            elements.optionsContainer.appendChild(btn);
        });
    }

    // 4. Handle Quiz Answer
    function handleAnswer(selectedIndex, item, clickedBtn) {
        // Disable all buttons to prevent validation spam
        const allBtns = elements.optionsContainer.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.disabled = true);

        // Check Logic
        const isCorrect = selectedIndex === item.correctOption;

        // Visual State
        if (isCorrect) {
            clickedBtn.classList.add('correct');
            showFeedback(true, "Correct!", item.explanation);
        } else {
            clickedBtn.classList.add('incorrect');
            // Highlight the correct one
            allBtns[item.correctOption].classList.add('correct');
            showFeedback(false, "Incorrect", item.explanation);
        }
    }

    // 5. Show Feedback
    function showFeedback(isCorrect, title, text) {
        elements.feedbackArea.classList.remove('hidden');
        elements.feedbackTitle.textContent = title;
        elements.feedbackTitle.style.color = isCorrect ? 'var(--success-color)' : 'var(--error-color)';
        elements.feedbackText.textContent = text;
    }

    // 6. Handle Archive Side Panel
    function renderArchive() {
        elements.archiveList.innerHTML = '';

        // Filter out the currently displayed item from the archive list
        // We assume the FIRST item in the sorted list is what's displayed as "Today's News"
        // (or we could track the displayed ID, but this is simpler for now)
        const pastNews = newsData.slice(1);

        if (pastNews.length === 0) {
            elements.archiveList.innerHTML = '<div style="padding:1rem; color:#888; text-align:center;">No past digests yet.</div>';
            return;
        }

        pastNews.forEach(item => {
            const div = document.createElement('div');
            div.className = 'archive-item';
            div.innerHTML = `
                <div class="archive-date">${item.date}</div>
                <div class="archive-title">${item.title}</div>
            `;

            div.addEventListener('click', () => {
                renderDailyDigest(item);
                closeSidebar();
            });

            elements.archiveList.appendChild(div);
        });
    }

    function openSidebar() {
        elements.archiveSidebar.classList.add('active');
        elements.archiveOverlay.classList.add('active');
    }

    function closeSidebar() {
        elements.archiveSidebar.classList.remove('active');
        elements.archiveOverlay.classList.remove('active');
    }

    // Event Listeners
    elements.archiveBtn.addEventListener('click', openSidebar);
    elements.closeArchive.addEventListener('click', closeSidebar);
    elements.archiveOverlay.addEventListener('click', closeSidebar);

    // Run
    init();
});
