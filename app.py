from flask import Flask, render_template, jsonify, request
import random
import os
import requests
import pandas as pd
import openpyxl
from datetime import datetime

app = Flask(__name__)

def validate_numbers(numbers):
    """
    Valida os números fornecidos pelo usuário
    """
    # Código existente de validação permanece o mesmo
    numbers = [int(n) for n in numbers if n]
    
    if len(numbers) != 18:
        return False, "É necessário preencher todos os 18 números"
    
    if any(n < 1 or n > 60 for n in numbers):
        return False, "Todos os números devem estar entre 01 e 60"
    
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
            new_n = min(n + 1, 60)
        else:
            new_n = max(n - 1, 1)
        modified.append(new_n)
    return modified

def create_random_combinations_from_plus_one(plus_one_games):
    """
    Cria 4 jogos aleatórios baseados exclusivamente nos Jogos +1
    """
    # Pega todos os números únicos dos jogos +1
    all_numbers = list(set([num for game in plus_one_games for num in game]))
    random_games = []
    
    # Gera 4 jogos aleatórios (1,2,3,4)
    for _ in range(4):
        game = sorted(random.sample(all_numbers, 6))
        random_games.append(game)
    
    return random_games

def create_games_from_original(original_games):
    """
    Cria jogos 5 e 6 baseados exclusivamente nos jogos originais 1,2,3
    """
    # Pega todos os números únicos dos jogos originais
    all_numbers = list(set([num for game in original_games for num in game]))
    additional_games = []
    
    # Gera 2 jogos adicionais (5 e 6)
    for _ in range(2):
        game = sorted(random.sample(all_numbers, 6))
        additional_games.append(game)
    
    return additional_games

def get_latest_result():
    """
    Busca o último resultado da Mega Sena via API
    """
    try:
        response = requests.get('https://loteriascaixa-api.herokuapp.com/api/megasena/latest')
        return response.json()
    except:
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_games', methods=['POST'])
def generate_games():
    numbers = request.json.get('numbers', [])
    
    valid, message = validate_numbers(numbers)
    if not valid:
        return jsonify({'error': message}), 400
    
    numbers = [int(n) for n in numbers if n]
    
    # Gera os jogos originais
    original_games = create_games(numbers)
    
    # Gera os jogos +1 e -1
    plus_one = create_games(modify_numbers(numbers, 1))
    minus_one = create_games(modify_numbers(numbers, -1))
    
    # Gera os 4 primeiros jogos aleatórios baseados nos jogos +1
    random_games = create_random_combinations_from_plus_one(plus_one)
    
    # Gera os jogos 5 e 6 baseados nos jogos originais
    additional_games = create_games_from_original(original_games)
    
    # Combina todos os jogos aleatórios
    random_games.extend(additional_games)
    
    # Busca o último resultado
    latest_result = get_latest_result()
    
    return jsonify({
        'original_games': original_games,
        'plus_one_games': plus_one,
        'minus_one_games': minus_one,
        'random_games': random_games,
        'latest_result': latest_result
    })

@app.route('/check_result/<int:concurso>', methods=['GET'])
def check_result(concurso):
    """
    Busca o resultado de um concurso específico
    """
    try:
        response = requests.get(f'https://loteriascaixa-api.herokuapp.com/api/megasena/{concurso}')
        return jsonify(response.json())
    except:
        return jsonify({'error': 'Concurso não encontrado'}), 404

@app.route('/export/<format>', methods=['POST'])
def export_games(format):
    """
    Exporta os jogos nos formatos solicitados
    """
    games = request.json
    
    if format == 'txt':
        content = "PALPITES MEGA SENA\n\n"
        for game_type, game_list in games.items():
            content += f"{game_type.upper()}\n"
            for game in game_list:
                content += " - ".join(str(num).zfill(2) for num in game) + "\n"
            content += "\n"
        
        return jsonify({
            'content': content,
            'filename': 'palpites_mega_sena.txt'
        })
    
    elif format == 'html':
        html_content = """
        <html>
        <head>
            <title>Palpites Mega Sena</title>
            <style>
                body { font-family: Arial; }
                .game { margin: 10px; }
            </style>
        </head>
        <body>
            <h1>Palpites Mega Sena</h1>
        """
        
        for game_type, game_list in games.items():
            html_content += f"<h2>{game_type}</h2>"
            for game in game_list:
                numbers = " - ".join(str(num).zfill(2) for num in game)
                html_content += f'<div class="game">{numbers}</div>'
        
        html_content += "</body></html>"
        
        return jsonify({
            'content': html_content,
            'filename': 'palpites_mega_sena.html'
        })
    
    elif format == 'xlsx':
        # Cria um DataFrame para cada tipo de jogo
        dfs = {}
        for game_type, game_list in games.items():
            df = pd.DataFrame(game_list)
            df.columns = [f'Dezena {i+1}' for i in range(6)]
            dfs[game_type] = df
        
        return jsonify({
            'content': {sheet: df.to_dict('records') for sheet, df in dfs.items()},
            'filename': 'palpites_mega_sena.xlsx'
        })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)