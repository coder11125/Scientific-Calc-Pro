 document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let currentExpression = "";
    let history = "";
    let lastAnswer = ""; // Store the last result for 'Ans' button
    let isRadian = false; // Start in Degree mode
    let isInverted = false;
    let isSoundOn = true; // Default sound on
    let calculationHistory = []; // Store calculation history

    // --- AUDIO ---
    let audioCtx;
    
    function initAudio() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser");
            isSoundOn = false; 
        }
    }
    initAudio(); 

    function playClickSound() {
        if (!audioCtx || !isSoundOn) return; 
        
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine'; 
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05); 

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05); 
    }

    // --- MATH INSTANCE ---
    const mathInstance = math.create(math.all, {
        number: 'BigNumber',
        precision: 64
    });
    
    // Add custom functions to math.js instance
    mathInstance.import({
        permutations: function(n, k) {
            if (k === undefined) k = n;
            if (typeof n !== 'number' || typeof k !== 'number') {
                throw new Error('Invalid input for permutations');
            }
            if (k < 0 || k > n || !Number.isInteger(n) || !Number.isInteger(k)) {
                return 0;
            }
            if (k === 0) return 1;
            
            let res = 1;
            for (let i = 0; i < k; i++) {
                res = mathInstance.multiply(res, n - i);
            }
            return res;
        },
        combinations: function(n, k) {
            if (typeof n !== 'number' || typeof k !== 'number') {
                throw new Error('Invalid input for combinations');
            }
            if (k < 0 || k > n || !Number.isInteger(n) || !Number.isInteger(k)) {
                return 0;
            }
            if (k === 0 || k === n) return 1;
            if (k > n / 2) k = n - k;
            
            return mathInstance.divide(mathInstance.permutations(n, k), mathInstance.factorial(k));
        },
        square: function(x) {
            return mathInstance.multiply(x, x);
        },
        sinh: function(x) {
            return (Math.exp(x) - Math.exp(-x)) / 2;
        },
        cosh: function(x) {
            return (Math.exp(x) + Math.exp(-x)) / 2;
        },
        tanh: function(x) {
            return mathInstance.sinh(x) / mathInstance.cosh(x);
        },
        log2: function(x) {
            return mathInstance.log(x) / mathInstance.log(2);
        }
    }, { override: true });
    
    mathInstance.config({
        angle: 'deg'
    });

    // --- DOM ELEMENTS ---
    const mainDisplay = document.getElementById('mainDisplay');
    const historyDisplay = document.getElementById('historyDisplay');
    const calculator = document.getElementById('calculator');
    const angleToggleBtn = document.getElementById('angleToggle');
    const invToggleBtn = document.getElementById('invToggle');
    const functionButtons = document.querySelectorAll('[data-action="function"]');
    const soundToggleBtn = document.getElementById('soundToggle');
    
    // Gemini Elements
    const explainBtn = document.getElementById('explainBtn');
    const wordProblemModal = document.getElementById('wordProblemModal');
    const closeWordProblemModal = document.getElementById('closeWordProblemModal');
    const submitWordProblem = document.getElementById('submitWordProblem');
    const wordProblemInput = document.getElementById('wordProblemInput');
    const wordProblemStatus = document.getElementById('wordProblemStatus');
    
    const explanationModal = document.getElementById('explanationModal');
    const closeExplanationModal = document.getElementById('closeExplanationModal');
    const explanationContent = document.getElementById('explanationContent');

    // Statistics Modal Elements
    const statisticsModal = document.getElementById('statisticsModal');
    const closeStatisticsModal = document.getElementById('closeStatisticsModal');
    const statisticsInput = document.getElementById('statisticsInput');
    const statisticsResults = document.getElementById('statisticsResults');
    const calculateStatistics = document.getElementById('calculateStatistics');

    // History Modal Elements
    const historyModal = document.getElementById('historyModal');
    const closeHistoryModal = document.getElementById('closeHistoryModal');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');

    // --- ICONS ---
    const speakerIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>`;
    
    const speakerMutedIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>`;

    // --- GEMINI API FUNCTIONS ---

    const API_KEY = ""; // Leave empty, will be provided by environment
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

    /**
     * Fetches from API with exponential backoff.
     */
    async function fetchWithBackoff(url, options, retries = 3, delay = 1000) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status === 429 && retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return fetchWithBackoff(url, options, retries - 1, delay * 2);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error("Fetch error:", error);
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithBackoff(url, options, retries - 1, delay * 2);
            }
            return { error: `API request failed: ${error.message}` };
        }
    }

    /**
     * Calls the Gemini API with a specific prompt.
     */
    async function callGemini(userQuery, systemPrompt) {
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        };

        const result = await fetchWithBackoff(API_URL, options);

        if (result.error) {
            return `Error: ${result.error}`;
        }
        
        const candidate = result.candidates?.[0];
        if (candidate && candidate.content?.parts?.[0]?.text) {
            return candidate.content.parts[0].text;
        } else {
            return "Error: Could not parse LLM response.";
        }
    }
    
    // --- CORE CALCULATOR FUNCTIONS ---
    
    function formatForDisplay(expression) {
        return expression
            .replace(/ \/ /g, ' ÷ ')
            .replace(/ \* /g, ' × ')
            .replace(/ - /g, ' − ');
    }

    function updateDisplay() {
        mainDisplay.textContent = formatForDisplay(currentExpression === "" ? "0" : currentExpression);
        historyDisplay.textContent = formatForDisplay(history);
        adjustFontSize(); 
    }

    function handleButtonClick(event) {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        playClickSound(); 

        const button = event.target.closest('button');
        if (!button) return; 

        explainBtn.classList.add('hidden');

        const { action, value, invValue } = button.dataset;

        switch (action) {
            case 'number':
            case 'operator':
            case 'constant':
                if (currentExpression === "0" && value !== ".") currentExpression = "";
                currentExpression += value;
                break;
            
            case 'function':
                if (currentExpression === "0") currentExpression = "";
                currentExpression += isInverted ? invValue : value;
                
                if (isInverted) {
                    isInverted = false;
                    invToggleBtn.classList.remove('btn-toggle-active');
                    updateInverseButtons();
                }
                break;
            
            case 'command':
                handleCommand(value);
                break;
            
            case 'toggle':
                handleToggle(value);
                break;
        }
        updateDisplay();
    }

    // --- KEYBOARD INPUT HANDLER ---
    function handleKeyboardInput(event) {
        const key = event.key;
        let handled = false;

        // Number keys
        if (key >= '0' && key <= '9') {
            if (currentExpression === "0") currentExpression = "";
            currentExpression += key;
            handled = true;
        }
        // Basic operators
        else if (key === '+' || key === '-' || key === '*' || key === '/') {
            if (key === '*') currentExpression += ' * ';
            else if (key === '/') currentExpression += ' / ';
            else if (key === '+') currentExpression += ' + ';
            else if (key === '-') currentExpression += ' - ';
            handled = true;
        }
        // Decimal point
        else if (key === '.') {
            currentExpression += '.';
            handled = true;
        }
        // Equals
        else if (key === '=' || key === 'Enter') {
            calculateResult();
            handled = true;
        }
        // Backspace
        else if (key === 'Backspace') {
            if (currentExpression.endsWith(' ')) {
                currentExpression = currentExpression.slice(0, -3);
            } else {
                currentExpression = currentExpression.slice(0, -1);
            }
            handled = true;
        }
        // Clear
        else if (key === 'Escape') {
            currentExpression = "";
            history = "";
            lastAnswer = "";
            handled = true;
        }
        // Parentheses
        else if (key === '(') {
            currentExpression += '(';
            handled = true;
        }
        else if (key === ')') {
            currentExpression += ')';
            handled = true;
        }
        // Modulo
        else if (key === '%') {
            currentExpression += ' % ';
            handled = true;
        }
        // Power (caret)
        else if (key === '^') {
            currentExpression += ' ^ ';
            handled = true;
        }

        if (handled) {
            event.preventDefault();
            explainBtn.classList.add('hidden');
            playClickSound();
            updateDisplay();
        }
    }

    async function handleCommand(command) {
        switch (command) {
            case 'clear':
                currentExpression = "";
                history = "";
                lastAnswer = "";
                explainBtn.classList.add('hidden');
                break;
            
            case 'backspace':
                if (currentExpression.endsWith(' ')) {
                    currentExpression = currentExpression.slice(0, -3); 
                } else {
                    currentExpression = currentExpression.slice(0, -1);
                }
                break;
                
            case 'equals':
                calculateResult();
                break;
            
            case 'ans':
                if (currentExpression === "0") currentExpression = "";
                currentExpression += lastAnswer;
                break;
            
            case 'word-problem':
                wordProblemInput.value = "";
                wordProblemStatus.textContent = "";
                wordProblemModal.classList.remove('hidden');
                break;

            case 'statistics':
                statisticsInput.value = "";
                statisticsResults.innerHTML = "";
                statisticsModal.classList.remove('hidden');
                break;

            case 'history':
                updateHistoryDisplay();
                historyModal.classList.remove('hidden');
                break;
        }
    }
    
    function handleToggle(toggleType) {
        switch (toggleType) {
            case 'angle':
                isRadian = !isRadian;
                mathInstance.config({
                    angle: isRadian ? 'rad' : 'deg'
                });
                angleToggleBtn.textContent = isRadian ? 'RAD' : 'DEG';
                angleToggleBtn.classList.toggle('btn-toggle-active');
                break;
            
            case 'inverse':
                isInverted = !isInverted;
                invToggleBtn.classList.toggle('btn-toggle-active');
                updateInverseButtons();
                break;
        }
    }

    function updateInverseButtons() {
        functionButtons.forEach(btn => {
            const { label, invLabel } = btn.dataset;
            if (label && invLabel) {
                btn.textContent = isInverted ? invLabel : label;
            }
        });
    }

    function calculateResult() {
        if (currentExpression === "") return;
        
        try {
            let evalExpression = currentExpression;

            let result = mathInstance.evaluate(evalExpression);
            let formattedResult = mathInstance.format(result, { notation: 'auto', precision: 14 });

            history = currentExpression + " =";
            currentExpression = formattedResult.toString();
            lastAnswer = currentExpression; 
            
            // Add to calculation history
            calculationHistory.push({
                expression: history + " " + currentExpression,
                timestamp: new Date().toLocaleTimeString()
            });

            explainBtn.classList.remove('hidden');

        } catch (error) {
            console.error("Calculation Error:", error);
            history = "Error";
            currentExpression = "Invalid Expression";
            explainBtn.classList.add('hidden');
        }
    }

    function adjustFontSize() {
        const baseFontSize = 3; 
        const minFontSize = 1.25; 
        const step = 0.25; 
        
        mainDisplay.style.fontSize = `${baseFontSize}rem`;
        mainDisplay.style.lineHeight = '1'; 
        
        let currentFontSize = baseFontSize;
        
        while (mainDisplay.scrollWidth > mainDisplay.clientWidth - 4 && currentFontSize > minFontSize) {
            currentFontSize -= step;
            mainDisplay.style.fontSize = `${currentFontSize}rem`;
        }
    }

    function toggleSound() {
        isSoundOn = !isSoundOn;
        soundToggleBtn.innerHTML = isSoundOn ? speakerIcon : speakerMutedIcon;
        localStorage.setItem('calculator-sound', isSoundOn ? 'on' : 'off');
    }

    // --- STATISTICS FUNCTIONS ---
    function calculateStatistics() {
        const input = statisticsInput.value.trim();
        if (!input) {
            statisticsResults.innerHTML = '<p class="text-red-500">Please enter numbers</p>';
            return;
        }

        try {
            const numbers = input.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
            if (numbers.length === 0) {
                statisticsResults.innerHTML = '<p class="text-red-500">Invalid input</p>';
                return;
            }

            // Calculate statistics
            const sum = numbers.reduce((a, b) => a + b, 0);
            const mean = sum / numbers.length;
            const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
            const stdDev = Math.sqrt(variance);
            const min = Math.min(...numbers);
            const max = Math.max(...numbers);
            const median = (numbers.sort((a, b) => a - b)[Math.floor(numbers.length / 2)]);

            statisticsResults.innerHTML = `
                <div class="bg-blue-50 p-2 rounded"><strong>Count:</strong> ${numbers.length}</div>
                <div class="bg-blue-50 p-2 rounded"><strong>Sum:</strong> ${sum.toFixed(4)}</div>
                <div class="bg-blue-50 p-2 rounded"><strong>Mean:</strong> ${mean.toFixed(4)}</div>
                <div class="bg-blue-50 p-2 rounded"><strong>Median:</strong> ${median.toFixed(4)}</div>
                <div class="bg-blue-50 p-2 rounded"><strong>Min:</strong> ${min.toFixed(4)}</div>
                <div class="bg-blue-50 p-2 rounded"><strong>Max:</strong> ${max.toFixed(4)}</div>
                <div class="bg-blue-50 p-2 rounded"><strong>Std Dev:</strong> ${stdDev.toFixed(4)}</div>
                <div class="bg-blue-50 p-2 rounded"><strong>Variance:</strong> ${variance.toFixed(4)}</div>
            `;
        } catch (error) {
            statisticsResults.innerHTML = '<p class="text-red-500">Calculation error</p>';
        }
    }

    function updateHistoryDisplay() {
        if (calculationHistory.length === 0) {
            historyList.innerHTML = '<p class="text-gray-500">No history yet</p>';
            return;
        }

        historyList.innerHTML = calculationHistory.slice().reverse().map((item, index) => `
            <div class="bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors" onclick="loadFromHistory('${item.expression}')">
                <div class="font-mono text-sm">${item.expression}</div>
                <div class="text-xs text-gray-500">${item.timestamp}</div>
            </div>
        `).join('');
    }

    // Global function to load from history
    window.loadFromHistory = function(expression) {
        currentExpression = expression.split(' = ')[1] || expression;
        history = expression.split(' = ')[0] || "";
        updateDisplay();
        historyModal.classList.add('hidden');
    };

    // --- EVENT LISTENERS ---
    calculator.addEventListener('click', handleButtonClick);
    document.addEventListener('keydown', handleKeyboardInput);
    
    soundToggleBtn.addEventListener('click', (e) => {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        toggleSound();
        e.stopPropagation(); 
    });

    // --- GEMINI MODAL LISTENERS ---

    // Word Problem Modal
    closeWordProblemModal.addEventListener('click', () => {
        wordProblemModal.classList.add('hidden');
    });

    submitWordProblem.addEventListener('click', async () => {
        const problemText = wordProblemInput.value;
        if (!problemText) {
            wordProblemStatus.textContent = "Please enter a problem.";
            return;
        }

        wordProblemStatus.textContent = "Generating expression... ✨";
        submitWordProblem.disabled = true;

        const systemPrompt = "You are a math expression generator. Convert the user's word problem into a single, valid mathematical expression for a calculator. Only output the expression. For example: '5 times 10' -> '5 * 10'. 'sine of 90 degrees' -> 'sin(90)'. 'log of 100' -> 'log10(100)'. '10 permute 3' -> 'permutations(10, 3)'. '10 choose 3' -> 'combinations(10, 3)'. Use operators like `*`, `/`, `+`, `-` and functions like `sin()`, `cos()`, `tan()`, `log10()`, `log()` (for natural log), `sqrt()`, `factorial()`, `pow(base, exp)`, `permutations(n, k)`, `combinations(n, k)`. If you cannot convert it, output 'Error: Invalid problem'.";
        
        const expression = await callGemini(problemText, systemPrompt);

        submitWordProblem.disabled = false;
        
        if (expression.startsWith("Error:")) {
            wordProblemStatus.textContent = expression;
        } else {
            currentExpression = expression;
            history = `Word problem: "${problemText}"`;
            updateDisplay();
            wordProblemModal.classList.add('hidden');
        }
    });
    
    // Explanation Modal
    explainBtn.addEventListener('click', async () => {
        explanationContent.innerHTML = "Loading explanation... ✨";
        explanationModal.classList.remove('hidden');

        const systemPrompt = "You are a math tutor. Explain the following calculation step-by-step. Be concise and clear. The user's calculation was:";
        const userQuery = `${history} ${currentExpression}`;

        const explanation = await callGemini(userQuery, systemPrompt);
        
        const formattedExplanation = explanation
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        explanationContent.innerHTML = formattedExplanation;
    });

    closeExplanationModal.addEventListener('click', () => {
        explanationModal.classList.add('hidden');
    });

    // --- STATISTICS MODAL LISTENERS ---
    closeStatisticsModal.addEventListener('click', () => {
        statisticsModal.classList.add('hidden');
    });

    calculateStatistics.addEventListener('click', calculateStatistics);

    statisticsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateStatistics();
        }
    });

    // --- HISTORY MODAL LISTENERS ---
    closeHistoryModal.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });

    clearHistoryBtn.addEventListener('click', () => {
        calculationHistory = [];
        updateHistoryDisplay();
    });

    // --- INITIALIZATION ---
    
    function initializeSettings() {
        // Load Sound
        const savedSound = localStorage.getItem('calculator-sound');
        if (savedSound === 'off') {
            isSoundOn = false;
        }
        soundToggleBtn.innerHTML = isSoundOn ? speakerIcon : speakerMutedIcon;

        // Load calculation history from localStorage
        const savedHistory = localStorage.getItem('calculator-history');
        if (savedHistory) {
            calculationHistory = JSON.parse(savedHistory);
        }
    }

    // Save history to localStorage on every calculation
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('calculator-history', JSON.stringify(calculationHistory));
    });

    initializeSettings(); 
    updateDisplay(); 
});
