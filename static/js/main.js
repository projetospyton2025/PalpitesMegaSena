// Create input fields
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.number-inputs');
    for (let i = 0; i < 18; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 1;
        input.max = 60;
        input.className = 'number-input';
        input.setAttribute('data-index', i);
        container.appendChild(input);
        
        // Add event listeners
        input.addEventListener('input', validateAndMove);
        input.addEventListener('keydown', handleBackspace);
    }
});

 // Validate input and move to next field
function validateAndMove(event) {
    const input = event.target;
    const value = input.value;
    const index = parseInt(input.getAttribute('data-index'));

    // Remove leading zeros
    //if (value.startsWith('0')) {
    //    input.value = parseInt(value);
    //}

    // Validate range
    if (value < 1 || value > 60) {
        input.classList.add('error');
        return;
    }

    // Check for duplicates - Versão melhorada
    const allInputs = document.querySelectorAll('.number-input');
    const otherInputs = Array.from(allInputs).filter(i => i !== input);
    const isDuplicate = otherInputs.some(i => i.value && parseInt(i.value) === parseInt(value));

    if (isDuplicate) {
        input.classList.add('error');
        return;
    }

    input.classList.remove('error');

    // Move to next input if available
    if (value.length === 2 && index < 17) {
        const nextInput = document.querySelector(`[data-index="${index + 1}"]`);
        nextInput.focus();
    }

    // Check if all inputs are filled and valid before generating games
    if (areAllInputsFilled() && !document.querySelector('.number-input.error')) {
        generateGames();
    }
}

// Handle backspace key
function handleBackspace(event) {
    if (event.key === 'Backspace' && !event.target.value) {
        const index = parseInt(event.target.getAttribute('data-index'));
        if (index > 0) {
            const prevInput = document.querySelector(`[data-index="${index - 1}"]`);
            prevInput.focus();
        }
    }
}

// Check if all inputs are filled
function areAllInputsFilled() {
    const inputs = document.querySelectorAll('.number-input');
    return Array.from(inputs).every(input => 
        input.value && !input.classList.contains('error'));
}

// Generate games
async function generateGames() {
    const inputs = document.querySelectorAll('.number-input');
    const numbers = Array.from(inputs).map(input => parseInt(input.value));

    try {
        const response = await fetch('/generate_games', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ numbers }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        displayGames(data);
        document.querySelector('.results').style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
    }
}

// Display games in the UI
function displayGames(data) {
    displayGameSet('original-games', data.original_games, 'Jogo');
    displayGameSet('plus-one-games', data.plus_one_games, 'Jogo +1');
    displayGameSet('minus-one-games', data.minus_one_games, 'Jogo -1');
    displayGameSet('random-games', data.random_games, 'Jogo Aleatório');
}

// Display a set of games
function displayGameSet(containerId, games, prefix) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    games.forEach((game, index) => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';

        const title = document.createElement('h4');
        // Adiciona uma classe específica baseada no tipo de jogo
        title.className = `game-title ${containerId}-title`;
        title.textContent = `${prefix} ${index + 1}`;

        const numbers = document.createElement('div');
        numbers.className = 'game-numbers';
        numbers.textContent = game.map(n => n.toString().padStart(2, '0')).join(' ');

        gameCard.appendChild(title);
        gameCard.appendChild(numbers);
        container.appendChild(gameCard);
    });
}

// Export to TXT
function exportToTxt() {
    let content = 'PALPITES MEGA SENA\n\n';

    // Add original games
    content += 'JOGOS NORMAIS:\n';
    content = addGamesToContent(content, 'original-games');

    // Add +1 games
    content += '\nJOGOS +1:\n';
    content = addGamesToContent(content, 'plus-one-games');

    // Add -1 games
    content += '\nJOGOS -1:\n';
    content = addGamesToContent(content, 'minus-one-games');

    // Add random games
    content += '\nJOGOS ALEATÓRIOS:\n';
    content = addGamesToContent(content, 'random-games');

    // Create and trigger download
    downloadFile(content, 'palpites-mega-sena.txt', 'text/plain');
}

// Export to Excel format (CSV)
function exportToExcel() {
    let content = 'PALPITES MEGA SENA\n\n';

    // Add all game types
    content += 'Jogos Normais\n';
    content = addGamesToContent(content, 'original-games', true);

    content += '\nJogos +1\n';
    content = addGamesToContent(content, 'plus-one-games', true);

    content += '\nJogos -1\n';
    content = addGamesToContent(content, 'minus-one-games', true);

    content += '\nJogos Aleatórios\n';
    content = addGamesToContent(content, 'random-games', true);

    // Create and trigger download
    downloadFile(content, 'palpites-mega-sena.csv', 'text/csv');
}

// Helper function to add games to export content
function addGamesToContent(content, containerId, isExcel = false) {
    const container = document.getElementById(containerId);
    const gameCards = container.querySelectorAll('.game-card');

    gameCards.forEach(card => {
        const numbers = card.querySelector('.game-numbers').textContent;
        if (isExcel) {
            // Format for Excel: separate numbers with tabs
            content += numbers.split(' ').join('\t') + '\n';
        } else {
            // Format for TXT: keep space-separated
            content += numbers + '\n';
        }
    });
    
    return content;
}

// Helper function to download file
function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
