

// Event Listeners de Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    // Criar campos de input
    const container = document.querySelector('.number-inputs');
    for (let i = 0; i < 18; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 1;
        input.max = 60;
        input.className = 'number-input';
        input.setAttribute('data-index', i);
        container.appendChild(input);
        
        input.addEventListener('input', validateAndMove);
        input.addEventListener('keydown', handleBackspace);
    }

    // Carregar último resultado
    try {
        const response = await fetch('/check_result/0');
        const data = await response.json();
        
        if (data && !data.error) {
            const concurso = data.concurso || data.numero;
            const dezenas = (data.dezenas || data.listaDezenas || []).map(d => parseInt(d, 10));
            
            const input = document.getElementById('concurso-input');
            if (input) input.value = concurso;
            
            atualizarResultadoSorteio(data);
            highlightNumbers(dezenas);
        }
    } catch (error) {
        console.error('Erro ao carregar último resultado:', error);
    }
});

// Funções de Validação e Input
function validateAndMove(event) {
    const input = event.target;
    const value = input.value.replace(/^0+/, '');
    const numValue = parseInt(value);
    const index = parseInt(input.getAttribute('data-index'));
    
    if (numValue < 1 || numValue > 60) {
        input.classList.add('error');
        return;
    }

    const linha = Math.floor(index / 6);
    const inicioLinha = linha * 6;
    const fimLinha = inicioLinha + 5;
    
    const inputsDaLinha = Array.from(document.querySelectorAll('.number-input'))
        .slice(inicioLinha, fimLinha + 1);
    
    const numerosPreenchidos = inputsDaLinha
        .filter(inp => inp.value && inp !== input)
        .map(inp => parseInt(inp.value))
        .sort((a, b) => a - b);

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

    const duplicadoNoGrupo = inputsDaLinha
        .filter(i => i !== input)
        .some(i => i.value && parseInt(i.value) === numValue);

    if (duplicadoNoGrupo) {
        input.classList.add('error');
        return;
    }

    input.classList.remove('error');

    input.addEventListener('blur', function() {
        if (this.value && !this.classList.contains('error')) {
            this.value = this.value.padStart(2, '0');
        }
    });

    if (input.value.length === 2 && index < 17) {
        const nextInput = document.querySelector(`[data-index="${index + 1}"]`);
        if (nextInput) nextInput.focus();
    }

    if (areAllInputsFilled()) {
        generateGames();
    }
}

function handleBackspace(event) {
    if (event.key === 'Backspace' && !event.target.value) {
        const index = parseInt(event.target.getAttribute('data-index'));
        if (index > 0) {
            const prevInput = document.querySelector(`[data-index="${index - 1}"]`);
            prevInput.focus();
        }
    }
}

function areAllInputsFilled() {
    const inputs = document.querySelectorAll('.number-input');
    return Array.from(inputs).every(input => 
        input.value && !input.classList.contains('error'));
}

// Funções de Geração e Exibição de Jogos
async function generateGames() {
    const inputs = document.querySelectorAll('.number-input');
    const numbers = Array.from(inputs).map(input => parseInt(input.value));

    try {
        const response = await fetch('/generate_games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numbers })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        displayGames(data);
        document.querySelector('.results').style.display = 'block';
        
        if (data.latest_result) {
            highlightNumbers(data.latest_result.dezenas);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayGames(data) {
    displayGameSet('original-games', data.original_games, 'Jogo');
    displayGameSet('plus-one-games', data.plus_one_games, 'Jogo +1');
    displayGameSet('minus-one-games', data.minus_one_games, 'Jogo -1');
    displayGameSet('random-games', data.random_games, 'Jogo Aleatório');
}

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
        numbers.textContent = game.map(n => String(n).padStart(2, '0')).join(' ');

        gameCard.appendChild(title);
        gameCard.appendChild(numbers);
        container.appendChild(gameCard);
    });
}
// Funções de Verificação de Resultado
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
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        atualizarResultadoSorteio(data);
        
        const dezenas = data.listaDezenas || data.dezenas || [];
        highlightNumbers(dezenas.map(d => parseInt(d, 10)));
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
    console.log('Dados recebidos da API:', data);

    // Preparação dos dados
    let dezenasSorteio = [];
    let dezenasOrdenadas = [];

    // API do Heroku usa dezenasOrdemSorteio e dezenas
    if (data.dezenasOrdemSorteio && data.dezenas) {
        // Mantendo exatamente como vem da API, sem conversões
        dezenasSorteio = Object.keys(data.dezenasOrdemSorteio).map(key => data.dezenasOrdemSorteio[key]);
        dezenasOrdenadas = Object.keys(data.dezenas).map(key => data.dezenas[key]);
    } 
    // API da Caixa usa dezenasSorteadasOrdemSorteio e listaDezenas
    else if (data.dezenasSorteadasOrdemSorteio && data.listaDezenas) {
        dezenasSorteio = data.dezenasSorteadasOrdemSorteio;
        dezenasOrdenadas = data.listaDezenas;
    }

    console.log('Dezenas ordem sorteio após processamento:', dezenasSorteio);
    console.log('Dezenas ordenadas após processamento:', dezenasOrdenadas);

    const sorteioInfo = document.querySelector('.sorteio-info');
    sorteioInfo.style.display = 'block';
    
    sorteioInfo.innerHTML = `
        <div class="resultado-container">
            <h3>Resultado do Concurso: ${data.numero || data.concurso}</h3>
            <p class="data-sorteio">Data do Sorteio: ${formatarData(data.dataApuracao || data.data)}</p>
            <p class="local-sorteio">Local: ${data.localSorteio || data.local || ''} ${data.nomeMunicipioUFSorteio || data.cidade || ''}</p>
            
            <div class="numeros-sorteados">
                <h4>Números por Ordem de Sorteio:</h4>
                <div class="dezenas">
                    ${dezenasSorteio.map(num => 
                        `<div class="dezena">${num.toString().padStart(2, '0')}</div>`
                    ).join('')}
                </div>
                
                <h4>Números em Ordem Crescente:</h4>
                <div class="dezenas">
                    ${dezenasOrdenadas.map(num => 
                        `<div class="dezena">${num.toString().padStart(2, '0')}</div>`
                    ).join('')}
                </div>
            </div>
            
            <div class="premiacoes">
                <h4>Premiações:</h4>
                ${montarHtmlPremiacoes(data)}
            </div>
            
            <div class="informacoes-adicionais">
                <h4>Informações Adicionais:</h4>
                <p>Valor Arrecadado: ${formatarMoeda(data.valorArrecadado || data.arrecadacaoTotal || 0)}</p>
                ${montarHtmlProximoConcurso(data)}
            </div>
        </div>
    `;
}

// Funções de Montagem de HTML
function montarHtmlPremiacoes(data) {
    const premiacoes = data.premiacoes || data.listaRateioPremio || [];
    if (!premiacoes.length) return '<p>Informações de premiação não disponíveis</p>';

    return premiacoes.map(premio => {
        const descricao = premio.descricao || premio.descricaoFaixa;
        const ganhadores = premio.ganhadores || premio.numeroDeGanhadores || 0;
        const valor = premio.valorPremio || 0;

        return `
            <div class="premio-item">
                <p>${descricao}: 
                   ${ganhadores} ${ganhadores === 1 ? 'ganhador' : 'ganhadores'} - 
                   ${formatarMoeda(valor)}</p>
            </div>
        `;
    }).join('');
}

function montarHtmlProximoConcurso(data) {
    const dataProximo = data.dataProximoConcurso || data.dataProximo;
    const valorEstimado = data.valorEstimadoProximoConcurso || data.valorEstimado || 0;
    const acumulado = data.acumulado || false;
    const valorAcumulado = data.valorAcumuladoProximoConcurso || data.valorAcumulado || 0;

    return `
        <div class="proximo-concurso">
            <h4>Próximo Concurso:</h4>
            ${dataProximo ? `<p>Data: ${formatarData(dataProximo)}</p>` : ''}
            ${acumulado ? `
                <p class="acumulado">ACUMULOU!</p>
                <p>Valor Acumulado: ${formatarMoeda(valorAcumulado)}</p>
            ` : ''}
            ${valorEstimado > 0 ? `<p>Prêmio Estimado: ${formatarMoeda(valorEstimado)}</p>` : ''}
        </div>
    `;
}

// Funções de Destaque de Números
function highlightNumbers(dezenasSorteadas) {
    if (!dezenasSorteadas || !Array.isArray(dezenasSorteadas)) {
        console.error('Dezenas inválidas:', dezenasSorteadas);
        return;
    }

    document.querySelectorAll('.number-highlight').forEach(span => {
        const text = span.textContent;
        span.replaceWith(text);
    });

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

// Funções de Formatação
function formatarNumero(num) {
    return String(num).padStart(2, '0');
}

function formatarMoeda(valor) {
    const numero = typeof valor === 'string' ? parseFloat(valor.replace(/[^\d.-]/g, '')) : valor;
    return (numero || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatarData(data) {
    if (!data) return '';
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
        return data;
    }

    try {
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        return data;
    }
}

// Funções de Exportação
function exportToTxt() {
    let content = 'PALPITES MEGA SENA\n\n';

    content += 'JOGOS NORMAIS:\n';
    content = addGamesToContent(content, 'original-games');

    content += '\nJOGOS +1:\n';
    content = addGamesToContent(content, 'plus-one-games');

    content += '\nJOGOS -1:\n';
    content = addGamesToContent(content, 'minus-one-games');

    content += '\nJOGOS ALEATÓRIOS:\n';
    content = addGamesToContent(content, 'random-games');

    downloadFile(content, 'palpites-mega-sena.txt', 'text/plain');
}

function exportToExcel() {
    let content = 'PALPITES MEGA SENA\n\n';

    content += 'Jogos Normais\n';
    content = addGamesToContent(content, 'original-games', true);

    content += '\nJogos +1\n';
    content = addGamesToContent(content, 'plus-one-games', true);

    content += '\nJogos -1\n';
    content = addGamesToContent(content, 'minus-one-games', true);

    content += '\nJogos Aleatórios\n';
    content = addGamesToContent(content, 'random-games', true);

    downloadFile(content, 'palpites-mega-sena.csv', 'text/csv');
}

function addGamesToContent(content, containerId, isExcel = false) {
    const container = document.getElementById(containerId);
    const gameCards = container.querySelectorAll('.game-card');

    gameCards.forEach(card => {
        const numbers = card.querySelector('.game-numbers').textContent;
        if (isExcel) {
            content += numbers.split(' ').join('\t') + '\n';
        } else {
            content += numbers + '\n';
        }
    });
    
    return content;
}

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
            const wb = XLSX.utils.book_new();
            Object.entries(data.content).forEach(([sheetName, rows]) => {
                const ws = XLSX.utils.json_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });
            XLSX.writeFile(wb, data.filename);
        } else {
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

function getGamesFromContainer(containerId) {
    const container = document.getElementById(containerId);
    return Array.from(container.querySelectorAll('.game-numbers'))
        .map(div => div.textContent.split(' ').map(Number));
}