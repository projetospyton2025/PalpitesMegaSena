# Create project structure

# New-Item e Set-Location comentado pois não precisa criar a paste
# New-Item -ItemType Directory -Path "PalpitesMegaSena"
# Set-Location "PalpitesMegaSena"

# Create subdirectories
New-Item -ItemType Directory -Path "static", "static/css", "static/js", "templates"


# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate

# Create requirements.txt
@"
Flask==2.0.1
pandas==1.3.3
openpyxl==3.0.9
"@ | Out-File -FilePath "requirements.txt"

# Install requirements
pip install -r requirements.txt

# Create empty files
New-Item -ItemType File -Path "app.py", "static/css/style.css", "static/js/main.js", "templates/index.html"

Write-Host "Project structure created successfully!"
Write-Host "Virtual environment is active and dependencies are installed."
Write-Host "You can start the application by running: python app.py"