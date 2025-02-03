from flask import Flask, render_template, jsonify, request
import random
import os

app = Flask(__name__)

def validate_numbers(numbers):
    """
    Valida os números fornecidos pelo usuário
    """
    # Converter todos os números para inteiros
    numbers = [int(n) for n in numbers if n]
    
    # Verificar se temos exatamente 18 números
    if len(numbers) != 18:
        return False, "É necessário preencher todos os 18 números"
    
    # Verificar se todos os números estão entre 1 e 60
    if any(n < 1 or n > 60 for n in numbers):
        return False, "Todos os números devem estar entre 01 e 60"
    
    # Verificar duplicatas dentro de cada grupo de 6 números
    for i in range(0, len(numbers), 6):
        grupo = numbers[i:i+6]
        if len(grupo) != len(set(grupo)):
            return False, f"Números repetidos encontrados no jogo {(i//6)+1}"
    
    return True, ""

def create_games(numbers):
    """
    Cria os jogos mantendo a ordem original dos números
    """
    return [numbers[i:i+6] for i in range(0, len(numbers), 6)]

def modify_numbers(numbers, increment):
    """
    Modifica cada número conforme as regras da Mega Sena
    """
    modified = []
    
    for n in numbers:
        if increment > 0:
            # Somando 1
            if n < 60:
                new_n = n + 1
            else:
                new_n = 60
        else:
            # Subtraindo 1
            if n == 1:
                new_n = 1  # Mantém 1 pois não existe 0
            else:
                new_n = n - 1
        
        modified.append(new_n)
    
    return modified

def create_random_combinations(plus_one_games, minus_one_games):
    """
    Cria 4 jogos aleatórios com base nas listas modificadas
    """
    all_numbers = list(set(plus_one_games + minus_one_games))
    
    # Verifica se há números suficientes para criar 4 jogos únicos
    if len(all_numbers) < 24:  # 4 jogos * 6 números
        current_num = 1
        while len(all_numbers) < 24:
            if current_num not in all_numbers and current_num <= 60:
                all_numbers.append(current_num)
            current_num += 1
    
    random_games = []
    used_numbers = set()
    
    for _ in range(4):
        available_numbers = [n for n in all_numbers if n not in used_numbers]
        
        if len(available_numbers) < 6:
            available_numbers = list(set(all_numbers) - set(used_numbers))
        
        game = sorted(random.sample(available_numbers, 6))
        used_numbers.update(game)
        random_games.append(game)
    
    return random_games

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_games', methods=['POST'])
def generate_games():
    numbers = request.json.get('numbers', [])
    
    # Validação dos números
    valid, message = validate_numbers(numbers)
    if not valid:
        return jsonify({'error': message}), 400
    
    # Convertendo strings para inteiros
    numbers = [int(n) for n in numbers if n]
    
    # Criando jogos
    original_games = create_games(numbers)
    plus_one = create_games(modify_numbers(numbers, 1))
    minus_one = create_games(modify_numbers(numbers, -1))
    
    # Criando combinações aleatórias
    random_games = create_random_combinations([n for game in plus_one for n in game],
                                              [n for game in minus_one for n in game])
    
    return jsonify({
        'original_games': original_games,
        'plus_one_games': plus_one,
        'minus_one_games': minus_one,
        'random_games': random_games
    })

# Configuração da porta para execução
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))  # Obtém a porta do ambiente ou usa 10000 como padrão
    app.run(host="0.0.0.0", port=port)  # Inicia o servidor Flask na porta correta
