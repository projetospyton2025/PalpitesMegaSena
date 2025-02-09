// Carrega o último resultado automaticamente ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/check_result/0'); // 0 para pegar o último resultado
        const data = await response.json();
        
        if (data && !data.error) {
            const concurso = data.concurso;
            const dezenas = data.dezenas.map(d => parseInt(d, 10));
            
            // Preenche o input com o número do último concurso
            const input = document.getElementById('concurso-input');
            if (input) input.value = concurso;
            
            // Atualiza a interface com o resultado
            atualizarResultadoSorteio(data);
            highlightNumbers(dezenas);
        }
    } catch (error) {
        console.error('Erro ao carregar último resultado:', error);
    }
});
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
// Modifique a função generateGames para incluir a verificação do último resultado
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
        
        // Verifica o último resultado automaticamente
        if (data.latest_result) {
            highlightNumbers(data.latest_result.dezenas);
        }
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

// Função para verificar resultado específico
async function checkConcurso(numero) {
    console.log('Verificando concurso:', numero);
    
    const sorteioInfo = document.querySelector('.sorteio-info');
    sorteioInfo.style.display = 'block';
    sorteioInfo.innerHTML = `
        <div class="loading">
            <p>Carregando resultado do concurso ${numero}...</p>
        </div>
    `;

    try {
        const response = await fetch(`/check_result/${numero}`);
        console.log('Status da resposta:', response.status);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dados recebidos:', data);

        if (data.error) {
            throw new Error(data.error);
        }

        // Atualiza a interface
        atualizarResultadoSorteio(data);
        
        // Aplica destaque nos números
        if (data.listaDezenas) {
            const dezenasSorteadas = data.listaDezenas.map(d => parseInt(d, 10));
            highlightNumbers(dezenasSorteadas);
        }

    } catch (error) {
        console.error('Erro:', error);
        sorteioInfo.innerHTML = `
            <div class="error-message">
                <p>Não foi possível carregar o resultado do concurso ${numero}</p>
                <p>Erro: ${error.message}</p>
                <button onclick="checkConcurso(${numero})" class="retry-button">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Função para atualizar o resultado do sorteio
function atualizarResultadoSorteio(data) {
    const sorteioInfo = document.querySelector('.sorteio-info');
    
    // Formata valores monetários
    const formatMoney = (value) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    // Template com todas as informações
    sorteioInfo.innerHTML = `
        <div class="resultado-container">
            <h3>Resultado do Concurso: ${data.numero}</h3>
            <p class="data-sorteio">Data do Sorteio: ${data.dataApuracao}</p>
            <p class="local-sorteio">Local: ${data.localSorteio} - ${data.nomeMunicipioUFSorteio}</p>
            
            <div class="numeros-sorteados">
                <h4>Números por Ordem de Sorteio:</h4>
                <div class="dezenas">
                    ${data.dezenasSorteadasOrdemSorteio.map(num => 
                        `<div class="dezena">${num.toString().padStart(2, '0')}</div>`
                    ).join('')}
                </div>
                
                <h4>Números em Ordem Crescente:</h4>
                <div class="dezenas">
                    ${data.listaDezenas.map(num => 
                        `<div class="dezena">${num.toString().padStart(2, '0')}</div>`
                    ).join('')}
                </div>
            </div>
            
            <div class="premiacoes">
                <h4>Premiações:</h4>
                ${data.listaRateioPremio.map(premio => `
                    <div class="premio-item">
                        <span class="faixa">${premio.descricaoFaixa}</span>
                        <span class="ganhadores">${premio.numeroDeGanhadores} 
                            ${premio.numeroDeGanhadores === 1 ? 'ganhador' : 'ganhadores'}</span>
                        <span class="valor">${formatMoney(premio.valorPremio)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="arrecadacao">
                <h4>Informações Adicionais:</h4>
                <p>Valor Arrecadado: ${formatMoney(data.valorArrecadado)}</p>
            </div>
            
            <div class="proximo-concurso">
                <h4>Próximo Concurso:</h4>
                ${data.dataProximoConcurso ? 
                    `<p>Data: ${data.dataProximoConcurso}</p>` : ''}
                ${data.acumulado ? 
                    `<p class="acumulado">ACUMULOU!</p>
                     <p>Valor Acumulado: ${formatMoney(data.valorAcumuladoProximoConcurso)}</p>` : 
                    ''}
                ${data.valorEstimadoProximoConcurso > 0 ?
                    `<p>Prêmio Estimado: ${formatMoney(data.valorEstimadoProximoConcurso)}</p>` : 
                    ''}
            </div>
        </div>
    `;
}

// Função para destacar números nos jogos
function highlightNumbers(dezenasSorteadas) {
    console.log('Destacando números:', dezenasSorteadas);
    
    if (!dezenasSorteadas || !Array.isArray(dezenasSorteadas)) {
        console.error('Dezenas inválidas:', dezenasSorteadas);
        return;
    }

    // Remove destaques anteriores
    document.querySelectorAll('.number-highlight').forEach(span => {
        const text = span.textContent;
        span.replaceWith(text);
    });

    // Destaca os números em todos os jogos
    document.querySelectorAll('.game-numbers').forEach(gameDiv => {
        const numbersText = gameDiv.textContent;
        const numbers = numbersText.split(' ').map(n => n.trim());
        
        const newContent = numbers.map(num => {
            const number = parseInt(num, 10);
            if (dezenasSorteadas.includes(number)) {
                return `<span class="number-highlight">${num}</span>`;
            }
            return num;
        }).join(' ');
        
        gameDiv.innerHTML = newContent;
    });
}



// Função para destacar números
function highlightNumbers(dezenasSorteadas) {
    console.log('Destacando números:', dezenasSorteadas);
    
    if (!dezenasSorteadas || !Array.isArray(dezenasSorteadas)) {
        console.error('Dezenas inválidas:', dezenasSorteadas);
        return;
    }

    // Remove destaques anteriores
    document.querySelectorAll('.number-highlight').forEach(span => {
        const text = span.textContent;
        span.replaceWith(text);
    });

    // Destaca os números em todos os jogos
    document.querySelectorAll('.game-numbers').forEach(gameDiv => {
        const numbersText = gameDiv.textContent;
        const numbers = numbersText.split(' ').map(n => n.trim());
        
        // Cria o novo conteúdo com os números destacados
        const newContent = numbers.map(num => {
            const number = parseInt(num, 10);
            if (dezenasSorteadas.includes(number)) {
                return `<span class="number-highlight">${num}</span>`;
            }
            return num;
        }).join(' ');
        
        gameDiv.innerHTML = newContent;
    });
}
// Funções de exportação
async function exportToFormat(format) {
    const games = {
        'Jogos Originais': getGamesFromContainer('original-games'),
        'Jogos +1': getGamesFromContainer('plus-one-games'),
        'Jogos -1': getGamesFromContainer('minus-one-games'),
        'Jogos Aleatórios': getGamesFromContainer('random-games')
    };

    try {
        const response = await fetch(`/export/${format}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(games)
        });

        const data = await response.json();
        
        if (format === 'xlsx') {
            // Para XLSX, usamos uma biblioteca específica
            const wb = XLSX.utils.book_new();
            Object.entries(data.content).forEach(([sheetName, rows]) => {
                const ws = XLSX.utils.json_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });
            XLSX.writeFile(wb, data.filename);
        } else {
            // Para TXT e HTML
            const blob = new Blob([data.content], { 
                type: format === 'txt' ? 'text/plain' : 'text/html' 
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Erro na exportação:', error);
    }
}

// Função auxiliar para pegar jogos de um container
function getGamesFromContainer(containerId) {
    const container = document.getElementById(containerId);
    return Array.from(container.querySelectorAll('.game-numbers'))
        .map(div => div.textContent.split(' ').map(Number));
}