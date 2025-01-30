from flask import Flask, render_template, jsonify, request
import random

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
    # Add or subtract 1 from each number, keeping within 1-60 range
    modified = []
    for n in numbers:
        new_n = n + increment
        if new_n < 1:
            new_n = 1
        elif new_n > 60:
            new_n = 60
        modified.append(new_n)
    return modified

def create_random_combinations(plus_one_games, minus_one_games):
    # Create 4 random games from the modified number sets
    all_numbers = list(set(plus_one_games + minus_one_games))
    random_games = []
    for _ in range(4):
        game = sorted(random.sample(all_numbers, 6))
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

if __name__ == '__main__':
    app.run(debug=True)