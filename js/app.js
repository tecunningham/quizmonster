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

    // DOM Elements
    elements: {},

    // Initialize the game
    init() {
        this.cacheElements();
        this.populatePresets();
        this.bindEvents();
    },

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            gameScreen: document.getElementById('game-screen'),
            loadingScreen: document.getElementById('loading-screen'),
            resultScreen: document.getElementById('result-screen'),
            presetSelect: document.getElementById('preset-select'),
            category1Input: document.getElementById('category1'),
            category2Input: document.getElementById('category2'),
            startBtn: document.getElementById('start-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            restartBtn: document.getElementById('restart-btn'),
            roundCounter: document.getElementById('round-counter'),
            scoreDisplay: document.getElementById('score-display'),
            targetLabel: document.getElementById('target-label'),
            image0: document.getElementById('image-0'),
            image1: document.getElementById('image-1'),
            imageCards: document.querySelectorAll('.image-card'),
            overlay: document.getElementById('overlay'),
            overlayIcon: document.getElementById('overlay-icon'),
            overlayText: document.getElementById('overlay-text'),
            finalScoreValue: document.getElementById('final-score-value'),
            resultMessage: document.getElementById('result-message')
        };
    },

    // Populate preset dropdown
    populatePresets() {
        const presets = Categories.getPresetNames();
        presets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.index;
            option.textContent = preset.name;
            this.elements.presetSelect.appendChild(option);
        });
    },

    // Bind event listeners
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.playAgainBtn.addEventListener('click', () => this.resetGame());
        this.elements.restartBtn.addEventListener('click', () => this.resetGame());

        this.elements.imageCards.forEach(card => {
            card.addEventListener('click', (e) => this.handleImageClick(e));
        });

        // Clear custom inputs when preset selected
        this.elements.presetSelect.addEventListener('change', () => {
            if (this.elements.presetSelect.value !== '') {
                this.elements.category1Input.value = '';
                this.elements.category2Input.value = '';
            }
        });

        // Clear preset when custom inputs used
        [this.elements.category1Input, this.elements.category2Input].forEach(input => {
            input.addEventListener('input', () => {
                this.elements.presetSelect.value = '';
            });
        });
    },

    // Show a specific screen
    showScreen(screenName) {
        ['startScreen', 'gameScreen', 'loadingScreen', 'resultScreen'].forEach(name => {
            this.elements[name].classList.add('hidden');
        });
        this.elements[screenName].classList.remove('hidden');
    },

    // Start the game
    async startGame() {
        // Get categories
        const presetIndex = this.elements.presetSelect.value;
        const customCat1 = this.elements.category1Input.value.trim();
        const customCat2 = this.elements.category2Input.value.trim();

        if (presetIndex !== '') {
            const preset = Categories.getPreset(parseInt(presetIndex));
            this.category1 = preset.category1;
            this.category2 = preset.category2;
            this.label1 = Categories.formatLabel(preset.category1);
            this.label2 = Categories.formatLabel(preset.category2);
        } else if (customCat1 && customCat2) {
            this.category1 = customCat1;
            this.category2 = customCat2;
            this.label1 = customCat1;
            this.label2 = customCat2;
        } else {
            alert('Please select a category pair or enter custom categories.');
            return;
        }

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

        // Get images
        const img1 = this.getUnusedImage(this.imagesForCategory1);
        const img2 = this.getUnusedImage(this.imagesForCategory2);

        // Randomly decide which goes where (0 = left, 1 = right)
        this.correctIndex = Math.random() < 0.5 ? 0 : 1;

        // Set images (no labels shown - that would give away the answer!)
        if (this.correctIndex === 0) {
            this.setImage(0, img1.url);
            this.setImage(1, img2.url);
        } else {
            this.setImage(0, img2.url);
            this.setImage(1, img1.url);
        }

        // Set the question (always ask for category 1)
        this.elements.targetLabel.textContent = this.label1;
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

        // Disable further clicks
        this.elements.imageCards.forEach(c => c.classList.add('disabled'));

        // Check answer
        const isCorrect = clickedIndex === this.correctIndex;

        if (isCorrect) {
            this.score++;
            card.classList.add('correct');
            this.showOverlay(true, 'Correct!');
        } else {
            card.classList.add('incorrect');
            this.elements.imageCards[this.correctIndex].classList.add('correct');
            this.showOverlay(false, `That was ${this.label2}`);
        }

        // Next round or end game
        setTimeout(() => {
            this.hideOverlay();
            if (this.currentRound >= this.totalRounds) {
                this.endGame();
            } else {
                this.nextRound();
            }
        }, 1200);
    },

    // Show full-screen overlay
    showOverlay(isCorrect, message) {
        this.elements.overlay.className = `overlay ${isCorrect ? 'correct' : 'incorrect'}`;
        this.elements.overlayIcon.textContent = isCorrect ? '✓' : '✗';
        this.elements.overlayText.textContent = message;
        this.elements.overlay.classList.remove('hidden');
    },

    // Hide overlay
    hideOverlay() {
        this.elements.overlay.classList.add('hidden');
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
