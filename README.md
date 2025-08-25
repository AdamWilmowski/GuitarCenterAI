# Guitar AI Description Generator

Aplikacja Flask do generowania opisów gitar i firm produkujących gitary przy użyciu OpenAI GPT. Aplikacja generuje opisy w języku polskim z pełnym wsparciem dla polskich znaków (UTF-8).

## Funkcje

- 🤖 **Generowanie opisów AI** - Tworzenie szczegółowych opisów gitar i firm w języku polskim
- 📝 **System poprawek** - Możliwość poprawiania wygenerowanych opisów przez AI
- 💾 **Zapisywanie opisów** - Przechowywanie opisów w bazie danych SQLite
- 🧠 **Uczenie się** - AI uczy się na podstawie poprawek użytkowników
- 🔐 **Uwierzytelnianie** - Ograniczony dostęp dla 2-3 użytkowników
- 🌍 **Wsparcie UTF-8** - Pełne wsparcie dla polskich znaków i terminologii muzycznej

## Technologie

- **Backend**: Flask, SQLAlchemy, OpenAI GPT-3.5-turbo
- **Frontend**: Bootstrap 5, JavaScript
- **Baza danych**: SQLite z kodowaniem UTF-8
- **Uwierzytelnianie**: Flask-Login
- **Język**: Python 3.8+

## Struktura projektu

```
GuitarAIAPI/
├── app.py                 # Główna aplikacja Flask
├── config/
│   └── settings.py        # Konfiguracja aplikacji
├── models/
│   ├── database.py        # Inicjalizacja bazy danych
│   ├── user.py           # Model użytkownika
│   └── descriptions.py   # Modele opisów i poprawek
├── routes/
│   ├── auth.py           # Uwierzytelnianie
│   ├── main.py           # Główne strony
│   └── api/              # Endpointy API
│       ├── descriptions.py
│       ├── saved_descriptions.py
│       ├── corrections.py
│       └── learning_data.py
├── utils/
│   └── ai_service.py     # Serwis AI
├── templates/            # Szablony HTML
├── static/              # Pliki statyczne
└── requirements.txt     # Zależności Python
```

## Instalacja

1. **Sklonuj repozytorium**
```bash
git clone <repository-url>
cd GuitarAIAPI
```

2. **Utwórz środowisko wirtualne**
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# lub
venv\Scripts\activate     # Windows
```

3. **Zainstaluj zależności**
```bash
pip install -r requirements.txt
```

4. **Skonfiguruj zmienne środowiskowe**
```bash
cp .env.example .env
# Edytuj .env i dodaj swój klucz OpenAI API
```

5. **Uruchom aplikację**
```bash
python app.py
```

## Konfiguracja

### Zmienne środowiskowe (.env)

```env
SECRET_KEY=your-secret-key-change-this
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL=sqlite:///guitar_ai.db
```

### Baza danych

Aplikacja automatycznie tworzy bazę danych SQLite z następującymi tabelami:

- **users** - Użytkownicy systemu
- **saved_descriptions** - Zapisane opisy referencyjne
- **returned_descriptions** - Wygenerowane przez AI opisy
- **model_corrections** - Poprawki do modelu AI
- **model_adjustments** - Dostosowania modelu

### Zarządzanie bazą danych

```bash
# Inicjalizacja bazy danych
python manage_db.py init

# Reset bazy danych
python manage_db.py reset

# Statystyki bazy danych
python manage_db.py stats

# Utworzenie nowego użytkownika
python manage_db.py create-user
```

## API Endpointy

### Generowanie opisów
- `POST /api/descriptions/generate` - Generowanie opisu gitary/firmy

### Zapisane opisy
- `POST /api/saved-descriptions/save` - Zapisywanie opisu
- `GET /api/saved-descriptions/list` - Lista zapisanych opisów
- `DELETE /api/saved-descriptions/<id>` - Usuwanie opisu

### Poprawki
- `POST /api/corrections/submit` - Zgłaszanie poprawki
- `GET /api/corrections/list` - Lista poprawek
- `POST /api/corrections/<id>/apply` - Zastosowanie poprawki

### Dane uczenia
- `GET /api/learning-data/dashboard` - Dane do dashboardu
- `GET /api/learning-data/user-stats` - Statystyki użytkownika

## Wsparcie dla języka polskiego

Aplikacja jest w pełni przystosowana do języka polskiego:

- **Generowanie opisów w języku polskim** z polską terminologią muzyczną
- **Przykłady opisów** w języku polskim
- **Interfejs użytkownika** w języku polskim
- **Kodowanie UTF-8** dla wszystkich polskich znaków
- **Polskie daty i formaty** w interfejsie

## Użycie

1. **Zaloguj się** używając domyślnych danych:
   - Użytkownik: `admin`
   - Hasło: `admin123`

2. **Generuj opisy gitar**:
   - Wprowadź informacje o gitarze (model, specyfikacje, cechy)
   - Kliknij "Generuj Opis"
   - AI wygeneruje szczegółowy opis w języku polskim

3. **Generuj opisy firm**:
   - Wprowadź informacje o firmie (historia, produkty, osiągnięcia)
   - Kliknij "Generuj Opis"
   - AI wygeneruje opis firmy w języku polskim

4. **Poprawiaj opisy**:
   - Kliknij "Popraw Opis" po wygenerowaniu
   - Wprowadź poprawki w języku polskim
   - AI nauczy się na podstawie poprawek

5. **Zapisuj opisy**:
   - Kliknij "Zapisz Opis" aby zachować opis
   - Dodaj tytuł, kategorię i tagi
   - Opisy będą dostępne jako przykłady dla AI

## Bezpieczeństwo

- Ograniczony dostęp dla 2-3 użytkowników
- Uwierzytelnianie przez Flask-Login
- Bezpieczne przechowywanie haseł (hashowanie)
- Walidacja danych wejściowych

## Rozwój

### Dodawanie nowych funkcji

1. Utwórz nowy blueprint w `routes/api/`
2. Dodaj modele do `models/descriptions.py` jeśli potrzebne
3. Zaktualizuj `utils/ai_service.py` dla nowej logiki AI
4. Dodaj endpointy do `app.py`

### Testowanie

```bash
# Uruchom w trybie debug
export FLASK_ENV=development
python app.py
```

## Licencja

MIT License

## Autor

Guitar AI Team
