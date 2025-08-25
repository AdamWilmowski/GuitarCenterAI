let currentType = '';
let currentOriginalText = '';
let currentDescriptionId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tabs
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target');
            console.log('Tab switched to:', targetId);
        });
    });
    
    // Load learning data when learning tab is shown
    document.getElementById('learning-tab').addEventListener('click', function() {
        loadLearningData();
    });
    
    // Load examples when examples tab is shown
    document.getElementById('examples-tab').addEventListener('click', function() {
        loadExamples();
    });
    
    // Add example form submission
    const addExampleForm = document.getElementById('addExampleForm');
    if (addExampleForm) {
        addExampleForm.addEventListener('submit', function(event) {
            event.preventDefault();
            addExample();
        });
    }
    
    // Ensure proper tab display
    const activeTab = document.querySelector('.nav-link.active');
    if (activeTab) {
        const targetId = activeTab.getAttribute('data-bs-target');
        const targetPane = document.querySelector(targetId);
        if (targetPane) {
            targetPane.classList.add('show', 'active');
        }
    }
});

// Add example function
function addExample() {
    const type = document.getElementById('exampleType').value;
    const content = document.getElementById('exampleContent').value;
    const title = document.getElementById('exampleTitle').value;
    const category = document.getElementById('exampleCategory').value;
    const tags = document.getElementById('exampleTags').value;

    if (!content.trim() || !title.trim() || !category.trim()) {
        showExampleMessage('Proszę wypełnić wszystkie wymagane pola.', 'danger');
        return;
    }

    showLoading(true);

    fetch('/api/examples/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: type,
            content: content,
            title: title,
            category: category,
            tags: tags || ''
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showLoading(false);
        if (data.success) {
            showExampleMessage('Przykład został dodany pomyślnie!', 'success');
            resetExampleForm();
            loadExamples(); // Refresh examples list
        } else {
            showExampleMessage('Błąd: ' + data.error, 'danger');
        }
    })
    .catch(error => {
        showLoading(false);
        console.error('Error adding example:', error);
        showExampleMessage('Błąd: ' + error.message, 'danger');
    });
}

// Load examples function
function loadExamples() {
    fetch('/api/examples/list')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displayExamples(data.examples);
        } else {
            console.error('Błąd podczas ładowania przykładów:', data.error);
            showExampleMessage('Błąd podczas ładowania przykładów: ' + data.error, 'danger');
        }
    })
    .catch(error => {
        console.error('Błąd podczas ładowania przykładów:', error);
        showExampleMessage('Błąd podczas ładowania przykładów: ' + error.message, 'danger');
    });
}

// Display examples function
function displayExamples(examples) {
    const container = document.getElementById('examplesList');
    if (!container) return;
    
    if (!examples || examples.length === 0) {
        container.innerHTML = '<p class="text-muted">Brak przykładów...</p>';
        return;
    }
    
    let html = '';
    examples.forEach(example => {
        html += `
            <div class="border-bottom pb-2 mb-2">
                <small class="text-muted">${new Date(example.created_at).toLocaleString('pl-PL')} - ${example.type}</small>
                <div class="mt-1">
                    <strong>Tytuł:</strong> ${example.title}
                </div>
                <div class="mt-1">
                    <strong>Kategoria:</strong> ${example.category}
                </div>
                <div class="mt-1">
                    <strong>Tagi:</strong> ${example.tags || 'Brak'}
                </div>
                <div class="mt-1">
                    <strong>Treść:</strong> ${example.content.substring(0, 200)}...
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Show example message function
function showExampleMessage(message, type) {
    const messageDiv = document.getElementById('exampleMessage');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `alert alert-${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}

// Reset example form function
function resetExampleForm() {
    const form = document.getElementById('addExampleForm');
    if (form) {
        form.reset();
    }
    
    const messageDiv = document.getElementById('exampleMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
        messageDiv.classList.remove('alert-success', 'alert-danger');
        messageDiv.textContent = '';
    }
}

// Generate description function
function generateDescription(type) {
    const inputElement = document.getElementById(type + 'Input');
    const outputElement = document.getElementById(type + 'Output');
    const actionsElement = document.getElementById(type + 'Actions');
    
    if (!inputElement || !outputElement || !actionsElement) {
        console.error('Required elements not found for type:', type);
        return;
    }
    
    if (!inputElement.value.trim()) {
        alert('Proszę wprowadzić jakieś informacje najpierw.');
        return;
    }
    
    showLoading(true);
    
    fetch('/api/descriptions/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: type,
            input_text: inputElement.value
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showLoading(false);
        if (data.success) {
            outputElement.innerHTML = data.description.replace(/\n/g, '<br>');
            actionsElement.style.display = 'block';
            currentType = type;
            currentOriginalText = data.description;
            currentDescriptionId = data.description_id;
        } else {
            outputElement.innerHTML = '<p class="text-danger">Błąd: ' + data.error + '</p>';
        }
    })
    .catch(error => {
        showLoading(false);
        console.error('Error generating description:', error);
        outputElement.innerHTML = '<p class="text-danger">Błąd: ' + error.message + '</p>';
    });
}

// Save description function
function saveDescription(type) {
    const outputElement = document.getElementById(type + 'Output');
    if (!outputElement) {
        console.error('Output element not found for type:', type);
        return;
    }
    
    const text = outputElement.innerText;
    
    const title = prompt('Podaj tytuł dla tego opisu:');
    if (!title) return;
    
    const category = prompt('Podaj kategorię (np. "Elektryczna", "Akustyczna", "Firma"):');
    if (!category) return;
    
    const tags = prompt('Podaj tagi oddzielone przecinkami (opcjonalnie):');
    
    fetch('/api/saved-descriptions/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: type,
            content: text,
            title: title,
            category: category,
            tags: tags || ''
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Opis został zapisany pomyślnie!');
        } else {
            alert('Błąd: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error saving description:', error);
        alert('Błąd: ' + error.message);
    });
}

// Enable correction function
function enableCorrection(type) {
    const outputElement = document.getElementById(type + 'Output');
    if (!outputElement) {
        console.error('Output element not found for type:', type);
        return;
    }
    
    const originalText = outputElement.innerText;
    
    const originalTextDiv = document.getElementById('originalText');
    const correctedTextArea = document.getElementById('correctedText');
    
    if (originalTextDiv && correctedTextArea) {
        originalTextDiv.innerText = originalText;
        correctedTextArea.value = originalText;
        
        const modal = new bootstrap.Modal(document.getElementById('correctionModal'));
        modal.show();
    } else {
        console.error('Modal elements not found');
    }
}

// Submit correction function
function submitCorrection() {
    const correctedTextArea = document.getElementById('correctedText');
    if (!correctedTextArea) {
        console.error('Corrected text area not found');
        return;
    }
    
    const correctedText = correctedTextArea.value;
    
    if (!correctedText.trim()) {
        alert('Proszę wprowadzić poprawiony tekst.');
        return;
    }
    
    fetch('/api/corrections/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            original: currentOriginalText,
            corrected: correctedText,
            type: currentType
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Poprawka została zatwierdzona pomyślnie!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('correctionModal'));
            if (modal) {
                modal.hide();
            }
        } else {
            alert('Błąd: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error submitting correction:', error);
        alert('Błąd: ' + error.message);
    });
}

// Load learning data function
function loadLearningData() {
    fetch('/api/learning-data/dashboard')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        displayCorrections(data.corrections);
        displaySavedDescriptions(data.saved_descriptions);
        displayReturnedDescriptions(data.returned_descriptions);
    })
    .catch(error => {
        console.error('Błąd podczas ładowania danych uczenia:', error);
    });
}

// Display corrections
function displayCorrections(corrections) {
    const container = document.getElementById('correctionsList');
    if (!container) return;
    
    if (!corrections || corrections.length === 0) {
        container.innerHTML = '<p class="text-muted">Brak poprawek...</p>';
        return;
    }
    
    let html = '';
    corrections.slice(-10).reverse().forEach(correction => {
        html += `
            <div class="border-bottom pb-2 mb-2">
                <small class="text-muted">${new Date(correction.timestamp).toLocaleString('pl-PL')} - ${correction.type}</small>
                <div class="mt-1">
                    <strong>Oryginalny:</strong> <span class="text-muted">${correction.original.substring(0, 100)}...</span>
                </div>
                <div class="mt-1">
                    <strong>Poprawiony:</strong> <span class="text-success">${correction.corrected.substring(0, 100)}...</span>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Display saved descriptions
function displaySavedDescriptions(descriptions) {
    const container = document.getElementById('savedDescriptionsList');
    if (!container) return;
    
    if (!descriptions || descriptions.length === 0) {
        container.innerHTML = '<p class="text-muted">Brak zapisanych opisów...</p>';
        return;
    }
    
    let html = '';
    descriptions.slice(-10).reverse().forEach(desc => {
        html += `
            <div class="border-bottom pb-2 mb-2">
                <small class="text-muted">${new Date(desc.timestamp).toLocaleString('pl-PL')} - ${desc.title}</small>
                <div class="mt-1">
                    ${desc.content.substring(0, 150)}...
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Display returned descriptions
function displayReturnedDescriptions(descriptions) {
    const container = document.getElementById('returnedDescriptionsList');
    if (!container) return;
    
    if (!descriptions || descriptions.length === 0) {
        container.innerHTML = '<p class="text-muted">Brak wygenerowanych opisów...</p>';
        return;
    }
    
    let html = '';
    descriptions.slice(-10).reverse().forEach(desc => {
        html += `
            <div class="border-bottom pb-2 mb-2">
                <small class="text-muted">${new Date(desc.timestamp).toLocaleString('pl-PL')} - ${desc.type}</small>
                <div class="mt-1">
                    ${desc.generated_description.substring(0, 150)}...
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Show/hide loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}
