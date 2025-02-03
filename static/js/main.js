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

// Função para formatar número com zero à esquerda
function formatNumber(num) {
    return num.toString().padStart(2, '0');
}


// Função para validar input e mover para o próximo campo
function validateAndMove(event) {
    const input = event.target;
    const value = input.value.replace(/^0+/, ''); // Remove zeros à esquerda para validação
    const numValue = parseInt(value);
    const index = parseInt(input.getAttribute('data-index'));
    
    // Validar range (1-60)
    if (numValue < 1 || numValue > 60) {
        input.classList.add('error');
        return;
    }

    // Determinar a linha atual (0, 1 ou 2)
    const linha = Math.floor(index / 6);
    const inicioLinha = linha * 6;
    const fimLinha = inicioLinha + 5;
    
    // Pegar todos os inputs da linha atual
    const inputsDaLinha = Array.from(document.querySelectorAll('.number-input'))
        .slice(inicioLinha, fimLinha + 1);
    
    // Pegar números preenchidos na linha atual (excluindo o input atual)
    const numerosPreenchidos = inputsDaLinha
        .filter(inp => inp.value && inp !== input)
        .map(inp => parseInt(inp.value))
        .sort((a, b) => a - b);

    // Verificar se o número mantém a ordem crescente
    const menoresQueAtual = numerosPreenchidos.filter(n => n < numValue);
    const maioresQueAtual = numerosPreenchidos.filter(n => n > numValue);
    
    if (menoresQueAtual.length > 0 && maioresQueAtual.length > 0) {
        const maiorMenor = Math.max(...menoresQueAtual);
        const menorMaior = Math.min(...maioresQueAtual);
        
        if (numValue <= maiorMenor || numValue >= menorMaior) {
            input.classList.add('error');
            return;
        }
    }

    // Verificar duplicatas APENAS dentro do grupo atual
    const duplicadoNoGrupo = inputsDaLinha
        .filter(i => i !== input)
        .some(i => i.value && parseInt(i.value) === numValue);

    if (duplicadoNoGrupo) {
        input.classList.add('error');
        return;
    }

    input.classList.remove('error');

    // Formatar com zero à esquerda quando o input perde o foco
    input.addEventListener('blur', function() {
        if (this.value && !this.classList.contains('error')) {
            this.value = this.value.padStart(2, '0');
        }
    });

    // Mover para próximo input se tiver 2 dígitos
    if (input.value.length === 2 && index < 17) {
        const nextInput = document.querySelector(`[data-index="${index + 1}"]`);
        if (nextInput) nextInput.focus();
    }

    // Verificar se todos os inputs estão preenchidos e válidos
    if (areAllInputsFilled()) {
        generateGames();
    }
}

// Função para verificar se todos os inputs estão preenchidos
function areAllInputsFilled() {
    const inputs = document.querySelectorAll('.number-input');
    return Array.from(inputs).every(input => 
        input.value && !input.classList.contains('error'));
}

// Função para lidar com a tecla backspace
function handleBackspace(event) {
    if (event.key === 'Backspace' && !event.target.value) {
        const index = parseInt(event.target.getAttribute('data-index'));
        if (index > 0) {
            const prevInput = document.querySelector(`[data-index="${index - 1}"]`);
            prevInput.focus();
        }
    }
}
/*
// Criar os campos de input
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.number-inputs');
    for (let i = 0; i < 18; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 2;
        input.className = 'number-input';
        input.setAttribute('data-index', i);
        container.appendChild(input);
        
        // Adicionar event listeners
        input.addEventListener('input', validateAndMove);
        input.addEventListener('keydown', handleBackspace);
    }
});*/

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

// Função para verificar se todos os inputs estão preenchidos
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
