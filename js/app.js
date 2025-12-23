// QuizMonster Game Logic
const Game = {
    // State
    currentRound: 0,
    totalRounds: 5,
    score: 0,
    category1: '',
    category2: '',
    label1: '',
    label2: '',
    correctIndex: 0,
    imagesForCategory1: [],
    imagesForCategory2: [],
    usedImages: new Set(),
    currentImg1: null,  // Current round's category1 image
    currentImg2: null,  // Current round's category2 image
    currentPresetSlug: null,  // Track if using a preset for share URL

    // DOM Elements
    elements: {},

    // Initialize the game
    init() {
        this.cacheElements();
        this.populatePresets();
        this.bindEvents();
        this.checkUrlParams();
    },

    // Check URL parameters and auto-start if present
    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const preset = params.get('preset');
        const cat1 = params.get('cat1');
        const cat2 = params.get('cat2');

        if (preset) {
            const presetData = Categories.getPreset(preset);
            if (presetData) {
                this.startWithPreset(preset);
            }
        } else if (cat1 && cat2) {
            this.category1 = cat1;
            this.category2 = cat2;
            this.label1 = cat1;
            this.label2 = cat2;
            this.loadAndStartGame();
        }
    },

    // Generate shareable URL for current game
    getShareUrl() {
        const base = window.location.origin + window.location.pathname;
        if (this.currentPresetSlug) {
            return `${base}?preset=${this.currentPresetSlug}`;
        } else if (this.category1 && this.category2) {
            return `${base}?cat1=${encodeURIComponent(this.category1)}&cat2=${encodeURIComponent(this.category2)}`;
        }
        return base;
    },

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            gameScreen: document.getElementById('game-screen'),
            loadingScreen: document.getElementById('loading-screen'),
            resultScreen: document.getElementById('result-screen'),
            presetButtons: document.getElementById('preset-buttons'),
            category1Input: document.getElementById('category1'),
            category2Input: document.getElementById('category2'),
            startBtn: document.getElementById('start-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            shareBtn: document.getElementById('share-btn'),
            roundCounter: document.getElementById('round-counter'),
            scoreDisplay: document.getElementById('score-display'),
            targetLabel: document.getElementById('target-label'),
            otherLabel: document.getElementById('other-label'),
            image0: document.getElementById('image-0'),
            image1: document.getElementById('image-1'),
            imageCards: document.querySelectorAll('.image-card'),
            previousRound: document.getElementById('previous-round'),
            prevImage0: document.getElementById('prev-image-0'),
            prevImage1: document.getElementById('prev-image-1'),
            prevCard0: document.getElementById('prev-card-0'),
            prevCard1: document.getElementById('prev-card-1'),
            prevMeta0: document.getElementById('prev-meta-0'),
            prevMeta1: document.getElementById('prev-meta-1'),
            finalScoreValue: document.getElementById('final-score-value'),
            resultMessage: document.getElementById('result-message')
        };
    },

    // Populate preset buttons
    populatePresets() {
        const presets = Categories.getPresetNames();
        presets.forEach(preset => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.dataset.slug = preset.slug;
            btn.textContent = preset.name;
            btn.addEventListener('click', () => this.startWithPreset(preset.slug));
            this.elements.presetButtons.appendChild(btn);
        });
    },

    // Bind event listeners
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.playAgainBtn.addEventListener('click', () => this.resetGame());
        this.elements.shareBtn.addEventListener('click', () => this.shareQuiz());

        this.elements.imageCards.forEach(card => {
            card.addEventListener('click', (e) => this.handleImageClick(e));
        });
    },

    // Copy share link to clipboard
    async shareQuiz() {
        const url = this.getShareUrl();
        try {
            await navigator.clipboard.writeText(url);
            this.elements.shareBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.elements.shareBtn.textContent = 'Copy Link';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            prompt('Copy this link:', url);
        }
    },

    // Start game with a preset (by slug)
    startWithPreset(slug) {
        const preset = Categories.getPreset(slug);
        if (!preset) return;
        this.currentPresetSlug = slug;
        this.category1 = preset.category1;
        this.category2 = preset.category2;
        this.label1 = Categories.formatLabel(preset.category1);
        this.label2 = Categories.formatLabel(preset.category2);
        this.loadAndStartGame();
    },

    // Show a specific screen
    showScreen(screenName) {
        ['startScreen', 'gameScreen', 'loadingScreen', 'resultScreen'].forEach(name => {
            this.elements[name].classList.add('hidden');
        });
        this.elements[screenName].classList.remove('hidden');
    },

    // Start game with custom categories
    startGame() {
        const customCat1 = this.elements.category1Input.value.trim();
        const customCat2 = this.elements.category2Input.value.trim();

        if (!customCat1 || !customCat2) {
            alert('Please enter both categories.');
            return;
        }

        this.currentPresetSlug = null;  // Custom game, not a preset
        this.category1 = customCat1;
        this.category2 = customCat2;
        this.label1 = customCat1;
        this.label2 = customCat2;
        this.loadAndStartGame();
    },

    // Load images and start the game
    async loadAndStartGame() {
        // Reset state
        this.currentRound = 0;
        this.score = 0;
        this.usedImages.clear();

        // Show loading screen
        this.showScreen('loadingScreen');

        // Pre-fetch images for all rounds
        try {
            const [images1, images2] = await Promise.all([
                Wikimedia.getValidatedImages(this.category1, this.totalRounds + 2),
                Wikimedia.getValidatedImages(this.category2, this.totalRounds + 2)
            ]);

            if (images1.length < this.totalRounds || images2.length < this.totalRounds) {
                alert('Could not find enough images for these categories. Try different search terms.');
                this.showScreen('startScreen');
                return;
            }

            this.imagesForCategory1 = images1;
            this.imagesForCategory2 = images2;

            // Start first round
            this.showScreen('gameScreen');
            this.nextRound();
        } catch (error) {
            console.error('Error loading images:', error);
            alert('Error loading images. Please try again.');
            this.showScreen('startScreen');
        }
    },

    // Get an unused image from a category
    getUnusedImage(images) {
        for (const img of images) {
            if (!this.usedImages.has(img.url)) {
                this.usedImages.add(img.url);
                return img;
            }
        }
        // If all used, return random one
        return images[Math.floor(Math.random() * images.length)];
    },

    // Set up next round
    nextRound() {
        this.currentRound++;

        // Update UI
        this.elements.roundCounter.textContent = `Round ${this.currentRound} of ${this.totalRounds}`;
        this.elements.scoreDisplay.textContent = `Score: ${this.score}`;

        // Reset image cards
        this.elements.imageCards.forEach(card => {
            card.classList.remove('correct', 'incorrect', 'disabled');
        });

        // Hide previous round on first round
        if (this.currentRound === 1) {
            this.elements.previousRound.classList.add('hidden');
        }

        // Get images and store them
        this.currentImg1 = this.getUnusedImage(this.imagesForCategory1);
        this.currentImg2 = this.getUnusedImage(this.imagesForCategory2);

        // Randomly decide which goes where (0 = left, 1 = right)
        this.correctIndex = Math.random() < 0.5 ? 0 : 1;

        // Set images (no labels shown - that would give away the answer!)
        if (this.correctIndex === 0) {
            this.setImage(0, this.currentImg1.url);
            this.setImage(1, this.currentImg2.url);
        } else {
            this.setImage(0, this.currentImg2.url);
            this.setImage(1, this.currentImg1.url);
        }

        // Set the question (always ask for category 1)
        this.elements.targetLabel.textContent = this.label1;
        this.elements.otherLabel.textContent = this.label2;
    },

    // Set image with loading state
    setImage(index, url) {
        const img = this.elements[`image${index}`];
        img.classList.add('loading');
        img.onload = () => img.classList.remove('loading');
        img.onerror = () => {
            img.classList.remove('loading');
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="%23333"/><text x="50%" y="50%" fill="%23666" text-anchor="middle">Image Error</text></svg>';
        };
        img.src = url;
    },

    // Handle image click
    handleImageClick(e) {
        const card = e.currentTarget;
        const clickedIndex = parseInt(card.dataset.index);

        // Check answer
        const isCorrect = clickedIndex === this.correctIndex;

        if (isCorrect) {
            this.score++;
        }

        // Show the previous round result
        this.showPreviousRound(clickedIndex, isCorrect);

        // Immediately go to next round or end game
        if (this.currentRound >= this.totalRounds) {
            this.endGame();
        } else {
            this.nextRound();
        }
    },

    // Show previous round results below current images
    showPreviousRound(clickedIndex, isCorrect) {
        const title1 = this.formatImageTitle(this.currentImg1?.title);
        const title2 = this.formatImageTitle(this.currentImg2?.title);

        // Set images
        this.elements.prevImage0.src = this.elements.image0.src;
        this.elements.prevImage1.src = this.elements.image1.src;

        // Reset classes
        this.elements.prevCard0.className = 'previous-card';
        this.elements.prevCard1.className = 'previous-card';

        // Determine which image is in which position and set metadata
        let meta0Label, meta0Title, meta1Label, meta1Title;
        if (this.correctIndex === 0) {
            meta0Label = this.label1;
            meta0Title = title1;
            meta1Label = this.label2;
            meta1Title = title2;
            this.elements.prevCard0.classList.add('was-target');
        } else {
            meta0Label = this.label2;
            meta0Title = title2;
            meta1Label = this.label1;
            meta1Title = title1;
            this.elements.prevCard1.classList.add('was-target');
        }

        // Mark clicked card as correct or incorrect
        if (clickedIndex === 0) {
            this.elements.prevCard0.classList.add(isCorrect ? 'correct' : 'incorrect');
        } else {
            this.elements.prevCard1.classList.add(isCorrect ? 'correct' : 'incorrect');
        }

        // Set metadata with result indicator
        const resultText = isCorrect ? '✓ Correct' : '✗ Wrong';
        const resultClass = isCorrect ? 'correct' : 'incorrect';

        this.elements.prevMeta0.innerHTML = `
            <div class="meta-label">${meta0Label}</div>
            <div class="meta-title">${meta0Title}</div>
            ${clickedIndex === 0 ? `<div class="meta-result ${resultClass}">${resultText}</div>` : ''}
        `;
        this.elements.prevMeta1.innerHTML = `
            <div class="meta-label">${meta1Label}</div>
            <div class="meta-title">${meta1Title}</div>
            ${clickedIndex === 1 ? `<div class="meta-result ${resultClass}">${resultText}</div>` : ''}
        `;

        this.elements.previousRound.classList.remove('hidden');
    },

    // Format Wikimedia title for display
    formatImageTitle(title) {
        if (!title) return 'Unknown';
        // Remove "File:" prefix and file extension
        return title
            .replace(/^File:/, '')
            .replace(/\.[^.]+$/, '')
            .replace(/_/g, ' ')
            .substring(0, 50) + (title.length > 50 ? '...' : '');
    },

    // End the game
    endGame() {
        this.elements.finalScoreValue.textContent = this.score;

        // Set result message
        const percentage = (this.score / this.totalRounds) * 100;
        let message = '';
        if (percentage === 100) {
            message = 'Perfect! You really know your stuff!';
        } else if (percentage >= 80) {
            message = 'Great job! Almost perfect!';
        } else if (percentage >= 60) {
            message = 'Good effort! Keep practicing!';
        } else if (percentage >= 40) {
            message = 'Not bad, but room for improvement!';
        } else {
            message = 'Better luck next time!';
        }
        this.elements.resultMessage.textContent = message;

        this.showScreen('resultScreen');
    },

    // Reset to start screen
    resetGame() {
        this.showScreen('startScreen');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => Game.init());
