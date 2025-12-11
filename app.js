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
            "id": "2023-12-11",
            "date": "2023-12-11",
            "source": "The Financial Times",
            "title": "Fed Holds Steady: Powell Signals Rate Cuts in 2024",
            "summary": "The Federal Reserve left interest rates unchanged at a 22-year high but signaled that its historic tightening campaign is likely over, projecting three quarter-point rate cuts next year.",
            "imageUrl": "assets/images/fed_powell.png",
            "articleUrl": "https://www.ft.com/content/fed-rates-unchanged",
            "question": "If the Federal Reserve signals rate cuts for 2024, what is the immediate expected mechanism of transmission to the real economy?",
            "options": [
                "Immediate increase in government spending due to lower debt service costs.",
                "A decrease in long-term bond yields as markets price in future lower rates, stimulating investment.",
                "An increase in tax revenues due to higher expected corporate profits."
            ],
            "correctOption": 1,
            "explanation": "Correct. Markets are forward-looking. When the Fed signals future cuts, bond traders bid up the price of long-term bonds, driving down yields. Lower yields reduce borrowing costs for mortgages and corporate investment immediately, even before the Fed actually cuts the overnight rate."
        },
        {
            "id": "2023-12-10",
            "date": "2023-12-10",
            "source": "The Economist",
            "title": "ECB's Dilemma: Inflation Cools but Wages Heat Up",
            "summary": "Eurozone inflation has dropped faster than expected to 2.4%, but Christine Lagarde warns that wage pressures remain too high to discuss loosening policy just yet.",
            "imageUrl": "assets/images/ecb_lagarde.png",
            "articleUrl": "https://www.economist.com/finance-and-economics/ecb-inflation-wages",
            "question": "Why would the ECB be reluctant to cut rates even if headline inflation is falling?",
            "options": [
                "Because fiscal policy in the Eurozone is currently too contractionary.",
                "Because high wage growth can lead to a 'wage-price spiral' in the services sector, keeping core inflation elevated.",
                "Because the Euro is currently too weak against the Dollar."
            ],
            "correctOption": 1,
            "explanation": "Correct. Even if energy prices drop (lowering headline inflation), if wages are rising fast (above productivity growth), service providers must raise prices to cover costs. This keeps 'core' inflation sticky, preventing the central bank from cutting rates prematurely."
        },
        {
            "id": "2023-12-09",
            "date": "2023-12-09",
            "source": "Bloomberg",
            "title": "Fiscal Drag: Germany Budget Crisis Deepens",
            "summary": "Germany's coalition government struggles to plug a €17bn hole in the 2024 budget after a court ruling banned the use of off-budget vehicles, forcing strict adherence to the 'debt brake'.",
            "imageUrl": "assets/images/germany_budget.png",
            "articleUrl": "https://www.bloomberg.com/news/articles/germany-budget-crisis",
            "question": "In the IS-LM framework, what is the effect of a forced reduction in government spending (fiscal contraction) to meet debt brake rules?",
            "options": [
                "The IS curve shifts left, lowering both output (Y) and interest rates (r).",
                "The IS curve shifts right, increasing output (Y) and interest rates (r).",
                "The LM curve shifts left, increasing interest rates (r) and lowering output (Y)."
            ],
            "correctOption": 0,
            "explanation": "Correct. A reduction in Government Spending (G) is a negative shock to aggregate demand. This shifts the IS curve to the left. The new equilibrium is at a lower level of income/output (Y) and a lower interest rate (r), as lower demand for money reduces the 'price' of money."
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

        newsData.forEach(item => {
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
