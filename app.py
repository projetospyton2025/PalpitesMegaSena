from flask import Flask, render_template, jsonify, request
import random
import os

app = Flask(__name__)

def validate_numbers(numbers):
    # Check if all numbers are within range and unique
    numbers = [int(n) for n in numbers if n]
    if len(numbers) != len(set(numbers)):
        return False, "Números repetidos não são permitidos"
    if any(n < 1 or n > 60 for n in numbers):
        return False, "Números devem estar entre 01 e 60"
    return True, ""

def create_games(numbers):
    # Sort numbers and split into groups of 6
    numbers.sort()
    return [numbers[i:i+6] for i in range(0, len(numbers), 6)]

def modify_numbers(numbers, increment):
    # Add or subtract 1 from each number, keeping within 1-60 range and avoiding duplicates
    modified = []
    used_numbers = set()
    
    for n in numbers:
        new_n = n + increment
        # Ajusta o número para estar dentro do intervalo 1-60
        if new_n < 1:
            new_n = 1
        elif new_n > 60:
            new_n = 60
            
        # Se o número já existe, tenta encontrar o próximo número disponível
        while new_n in used_numbers:
            if increment > 0:
                new_n = new_n + 1 if new_n < 60 else 59
            else:
                new_n = new_n - 1 if new_n > 1 else 2
                
        used_numbers.add(new_n)
        modified.append(new_n)
    
    return modified

def create_random_combinations(plus_one_games, minus_one_games):
    # Create 4 random games from the modified number sets
    all_numbers = list(set(plus_one_games + minus_one_games))
    
    # Verifica se há números suficientes para criar 4 jogos únicos
    if len(all_numbers) < 24:  # 4 jogos * 6 números
        # Adiciona números sequenciais até ter números suficientes
        current_num = 1
        while len(all_numbers) < 24:
            if current_num not in all_numbers and current_num <= 60:
                all_numbers.append(current_num)
            current_num += 1
    
    random_games = []
    used_numbers = set()
    
    for _ in range(4):
        # Filtra números disponíveis (não usados em outros jogos)
        available_numbers = [n for n in all_numbers if n not in used_numbers]
        
        # Se não houver números suficientes, reseta os números usados
        if len(available_numbers) < 6:
            available_numbers = list(set(all_numbers) - set(used_numbers))
        
        # Gera um novo jogo com números únicos
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
    
    # Validate input
    valid, message = validate_numbers(numbers)
    if not valid:
        return jsonify({'error': message}), 400
    
    # Create original games
    original_games = create_games(numbers)
    
    # Create +1 and -1 variations
    plus_one = create_games(modify_numbers(numbers, 1))
    minus_one = create_games(modify_numbers(numbers, -1))
    
    # Create random combinations
    random_games = create_random_combinations([n for game in plus_one for n in game],
                                           [n for game in minus_one for n in game])
    
    return jsonify({
        'original_games': original_games,
        'plus_one_games': plus_one,
        'minus_one_games': minus_one,
        'random_games': random_games
    })

"""
if __name__ == '__main__':
    app.run(debug=True)

"""
    # Configuração da porta
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))  # Obtém a porta do ambiente ou usa 5000 como padrão
    app.run(host="0.0.0.0", port=port)  # Inicia o servidor Flask na porta correta

