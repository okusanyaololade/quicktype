// DOM Elements
const startScreen = document.getElementById('startScreen');
const typingTest = document.getElementById('typingTest');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn'); // Header restart button
const tryAgainBtn = document.getElementById('tryAgainBtn'); // Modal try again button
const textInput = document.getElementById('textInput');
const textDisplay = document.getElementById('textDisplay');
const timerElement = document.getElementById('timer');
const wpmElement = document.getElementById('wpm');
const wordCountElement = document.getElementById('wordCount');
const resultsModal = document.getElementById('resultsModal');
const closeResultsBtn = document.getElementById('closeResults');
const finalWpmElement = document.getElementById('finalWpm');
const finalCorrectWordsElement = document.getElementById('finalCorrectWords');
const finalIncorrectCharsElement = document.getElementById('finalIncorrectChars');

// Test configuration
const TEST_DURATION = 60; // 60 seconds
const TEXT_BUFFER_THRESHOLD = 50; // Number of characters remaining before loading more text
const MAX_VISIBLE_CHARS = 200; // Maximum number of characters to keep in the display

// Christian-themed texts
const CHRISTIAN_TEXTS = [
    "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. John 3:16",
    "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight. Proverbs 3:5-6",
    "I can do all things through Christ who strengthens me. Philippians 4:13",
    "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul. Psalm 23:1-3",
    "But seek first his kingdom and his righteousness, and all these things will be given to you as well. Matthew 6:33",
    "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. Philippians 4:6",
    "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future. Jeremiah 29:11",
    "Jesus answered, 'I am the way and the truth and the life. No one comes to the Father except through me.John 14:6",
    "And we know that in all things God works for the good of those who love him, who have been called according to his purpose. Romans 8:28",
    "The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid? Psalm 27:1"
];

// State variables
let timer;
let timeLeft = TEST_DURATION;
let isTestRunning = false;
let correctChars = 0;
let incorrectChars = 0;
let totalTyped = 0;
let currentText = '';
let words = [];
let currentWordIndex = 0;
let startTime;
let endTime;
let usedTexts = [];
let textStartIndex = 0; // Track the starting index of visible text
let typedChars = []; // Track each character typed to recalculate stats on backspace

// Initialize the application
function init() {
    // Event Listeners
    startBtn.addEventListener('click', startTest);
    if (restartBtn) {
        restartBtn.addEventListener('click', restartTest);
    }
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', restartTest);
    }
    textInput.addEventListener('input', handleTyping);
    closeResultsBtn.addEventListener('click', closeResults);
    
    // Show start screen by default
    showStartScreen();
}

// Show start screen and hide typing test
function showStartScreen() {
    startScreen.classList.remove('hidden');
    typingTest.classList.add('hidden');
    timerElement.classList.add('hidden');
    restartBtn.classList.add('hidden');
}

// Show typing test and hide start screen
function showTypingTest() {
    startScreen.classList.add('hidden');
    typingTest.classList.remove('hidden');
    timerElement.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    textInput.focus();
}

// Get a random Christian text that hasn't been used recently
function getRandomChristianText() {
    let availableTexts = CHRISTIAN_TEXTS.filter(text => !usedTexts.includes(text));
    
    // If we've used all texts, reset the used texts array
    if (availableTexts.length === 0) {
        availableTexts = [...CHRISTIAN_TEXTS];
        usedTexts = [];
    }
    
    const randomIndex = Math.floor(Math.random() * availableTexts.length);
    const selectedText = availableTexts[randomIndex];
    
    // Add to used texts and keep only the last few to avoid repetition
    usedTexts.push(selectedText);
    if (usedTexts.length > 5) {
        usedTexts.shift();
    }
    
    return selectedText;
}

// Load text for the test with continuous generation
function loadText() {
    // Get a new text chunk
    const newText = getRandomChristianText();
    
    // Add to current text with a space if not empty
    currentText += (currentText ? ' ' : '') + newText;
    
    // Update the display
    updateTextDisplay();
}

function updateTextDisplay() {
    // Clear the display
    textDisplay.innerHTML = '';
    
    // Calculate visible portion of text
    const visibleStart = Math.max(0, totalTyped - 50);
    const visibleEnd = Math.min(currentText.length, visibleStart + MAX_VISIBLE_CHARS);
    const visibleText = currentText.substring(visibleStart, visibleEnd);
    
    // Create spans for each character
    for (let i = 0; i < visibleText.length; i++) {
        const globalIndex = visibleStart + i;
        const char = visibleText[i];
        const span = document.createElement('span');
        
        // Handle spaces specially to ensure they're visible
        span.textContent = char === ' ' ? '\u00A0' : char;
        
        // Add appropriate class based on typing status
        if (globalIndex < totalTyped) {
            const expectedChar = currentText[globalIndex];
            const typedChar = typedChars[globalIndex] || '';
            const isCorrect = typedChar === expectedChar;
            
            // Reset all classes
            span.className = '';
            
            // Add the appropriate class
            if (isCorrect) {
                span.classList.add('correct');
            } else {
                span.classList.add('incorrect');
                // Force red color and underline
                span.style.color = '#ef4444';
                span.style.textDecoration = 'underline';
            }
        } else if (globalIndex === totalTyped) {
            span.className = 'current';
        }
        
        textDisplay.appendChild(span);
    }
    
    // Auto-scroll to keep current character in view
    const currentChar = textDisplay.querySelector('.current');
    if (currentChar) {
        currentChar.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
}

// Check if we need to load more text
function checkTextBuffer() {
    const remainingChars = currentText.length - totalTyped;
    if (remainingChars < TEXT_BUFFER_THRESHOLD) {
        loadText();
    }
}

// Start the typing test
function startTest() {
    if (isTestRunning) return;
    
    // Reset state
    resetTest();
    
    // Show typing test
    showTypingTest();
    
    // Set up the test
    isTestRunning = true;
    timeLeft = TEST_DURATION;
    updateTimer();
    startTime = new Date();
    
    // Start the timer
    timer = setInterval(() => {
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            endTest();
        }
    }, 1000);
    
    // Load initial text
    loadText();
    
    // Focus the input
    textInput.value = '';
    textInput.disabled = false;
    textInput.focus();
}

// Update the restart test function
// Restart the test
function restartTest() {
    console.log('Restarting test...');
    
    // Close the results modal if it's open
    if (resultsModal.classList.contains('active')) {
        closeResults();
    }
    
    // Reset test state
    resetTest();
    
    // Reset UI elements
    textDisplay.innerHTML = '';
    textInput.value = '';
    textInput.disabled = false;
    
    // Show typing test and hide start screen
    startScreen.classList.add('hidden');
    typingTest.classList.remove('hidden');
    
    // Reset test state variables
    timeLeft = TEST_DURATION;
    isTestRunning = false;
    correctChars = 0;
    incorrectChars = 0;
    totalTyped = 0;
    updateStats();
    
    // Start a fresh test
    startTest();
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    init();
});



function handleTyping(e) {
    if (!isTestRunning) return;
    
    const inputText = e.target.value;
    
    // Handle backspace/delete
    if (inputText.length < typedChars.length) {
        // User deleted characters - remove from typedChars array
        typedChars = typedChars.slice(0, inputText.length);
        
        // Recalculate stats based on current typed characters
        recalculateStats();
        
        // Update totalTyped
        totalTyped = typedChars.length;
        
        // Update the display and stats
        updateTextDisplay();
        updateStats();
        
        return;
    }
    
    // Check if we've typed anything new
    if (inputText.length <= typedChars.length) {
        return;
    }
    
    // Get the new character(s) that were added
    const newChars = inputText.slice(typedChars.length);
    
    // Process each new character
    for (let i = 0; i < newChars.length; i++) {
        const char = newChars[i];
        const expectedIndex = typedChars.length;
        
        // Check if we've reached the end of the current text
        if (expectedIndex >= currentText.length) {
            loadText();
        }
        
        // Store the typed character
        typedChars.push(char);
        
        // Check if the typed character matches the expected character
        if (char === currentText[expectedIndex]) {
            correctChars++;
        } else {
            incorrectChars++;
        }
        
        totalTyped++;
    }
    
    // Update the display and stats
    updateTextDisplay();
    updateStats();
    
    // Check if we need to load more text
    checkTextBuffer();
}

// Recalculate stats when backspace is used
function recalculateStats() {
    correctChars = 0;
    incorrectChars = 0;
    
    // Recalculate based on current typed characters
    for (let i = 0; i < typedChars.length; i++) {
        if (i < currentText.length && typedChars[i] === currentText[i]) {
            correctChars++;
        } else {
            incorrectChars++;
        }
    }
}


// Update the timer display
function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Update WPM and word count
function updateStats() {
    // Calculate time elapsed in minutes
    const timeElapsed = (TEST_DURATION - timeLeft) / 60;
    
    // Calculate total characters typed
    const totalTyped = correctChars + incorrectChars;
    
    // Calculate word count (5 chars = 1 word)
    const wordCount = totalTyped / 5;
    
    // Calculate WPM (words per minute)
    const wpm = timeElapsed > 0 ? Math.max(0, Math.round(wordCount / timeElapsed)) : 0;
    
    // Calculate net WPM (WPM * (correct chars / total typed))
    const netWpm = totalTyped > 0 ? Math.round(wpm * (correctChars / totalTyped)) : 0;

    // Update the UI
    wpmElement.textContent = netWpm;
    wordCountElement.textContent = Math.floor(wordCount);
    
    // For debugging
    // console.log('Stats:', { wpm, netWpm, wordCount, correctChars, incorrectChars, totalTyped });
}

// End the test
function endTest() {
    // Prevent multiple triggers
    if (!isTestRunning) {
        console.log('Test already ended, ignoring endTest call');
        return;
    }
    
    console.log('Ending test...');
    
    // Stop the timer and disable input
    clearInterval(timer);
    isTestRunning = false;
    textInput.disabled = true;
    
    // Calculate time elapsed in minutes
    const timeElapsed = (TEST_DURATION - timeLeft) / 60;
    
    // Calculate final stats
    const totalTyped = correctChars + incorrectChars;
    
    // Calculate word count (5 chars = 1 word)
    const wordCount = totalTyped / 5;
    
    // Calculate WPM
    const wpm = timeElapsed > 0 ? Math.max(0, Math.round(wordCount / timeElapsed)) : 0;
    
    // Calculate accuracy (starts at 0% and increases with correct inputs)
    const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 0;
    
    // Calculate net WPM (WPM * accuracy)
    const netWpm = Math.round(wpm * (accuracy / 100));
    
    console.log('Final stats:', { 
        wpm, 
        netWpm,
        accuracy, 
        wordCount: Math.floor(wordCount), 
        correctChars,
        incorrectChars,
        totalTyped,
        timeElapsed: (TEST_DURATION - timeLeft) + 's'
    });
    
    // Update the results modal with final stats (show net WPM)
    if (finalWpmElement) finalWpmElement.textContent = netWpm;
    if (finalCorrectWordsElement) finalCorrectWordsElement.textContent = Math.floor(wordCount);
    if (finalIncorrectCharsElement) finalIncorrectCharsElement.textContent = incorrectChars;
    
    // Show the results modal
    showResultsModal();
}
// Show results modal with animation
function showResultsModal() {
    console.log('Showing results modal');
    
    // Add active class to show modal (CSS handles visibility)
    resultsModal.classList.add('active');
    
    // Focus the try again button for better keyboard navigation
    setTimeout(() => {
        if (tryAgainBtn) {
            tryAgainBtn.focus();
        }
    }, 100);
}

// Close results modal
function closeResults() {
    console.log('Closing results modal');
    resultsModal.classList.remove('active');
    
    // Return focus to the start button
    if (startBtn) {
        startBtn.focus();
    }
}

// Reset the test to initial state
function resetTest() {
    clearInterval(timer);
    
    // Reset state
    timeLeft = TEST_DURATION;
    isTestRunning = false;
    correctChars = 0;
    incorrectChars = 0;
    totalTyped = 0;
    currentText = '';
    usedTexts = [];
    textStartIndex = 0;
    typedChars = []; // Reset typed characters array
    
    // Reset UI
    updateTimer();
    updateStats();
    textInput.value = '';
    textInput.disabled = true;
    
    // Clear the display
    textDisplay.innerHTML = '';
}

// Additional event listeners for modal interactions
closeResultsBtn.addEventListener('click', function() {
    closeResults();
    showStartScreen();
});

closeResultsBtn.addEventListener('click', function() {
    closeResults();
    showStartScreen();
});

// Close modal when clicking outside the content
resultsModal.addEventListener('click', (e) => {
    if (e.target === resultsModal) {
        closeResults();
        showStartScreen();
    }
});

// Handle keyboard events for the modal
document.addEventListener('keydown', (e) => {
    // Close modal with Escape key
    if (e.key === 'Escape' && resultsModal.classList.contains('active')) {
        closeResults();
        showStartScreen();
    }
    
    // Handle Enter key on the try again button when modal is open
    if (e.key === 'Enter' && resultsModal.classList.contains('active')) {
        if (document.activeElement === tryAgainBtn) {
            e.preventDefault();
            restartTest();
        } else if (document.activeElement === closeResultsBtn) {
            e.preventDefault();
            closeResults();
            showStartScreen();
        }
    }
});

// Remove the duplicate DOMContentLoaded listener since we're now initializing in the first one
