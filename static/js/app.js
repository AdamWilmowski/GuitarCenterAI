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
    
    // Load prompts when prompts tab is shown
    document.getElementById('prompts-tab').addEventListener('click', function() {
        loadPrompts();
    });
    
    // Add example form submission
    const addExampleForm = document.getElementById('addExampleForm');
    if (addExampleForm) {
        addExampleForm.addEventListener('submit', function(event) {
            event.preventDefault();
            addExample();
        });
    }
    
    // Add prompt form submission
    const addPromptForm = document.getElementById('addPromptForm');
    if (addPromptForm) {
        addPromptForm.addEventListener('submit', function(event) {
            event.preventDefault();
            addPrompt();
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
            console.log('Full description received:', data.description);
            console.log('Description length:', data.description.length);
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
    
    const text = outputElement.innerText || outputElement.textContent;
    console.log('Saving description, length:', text.length);
    console.log('Full text to save:', text);
    
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
    
    const originalText = outputElement.innerText || outputElement.textContent;
    console.log('Correction text length:', originalText.length);
    
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

// Load prompts function
function loadPrompts() {
    fetch('/api/prompts/list')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displayPrompts(data.prompts);
        } else {
            console.error('Błąd podczas ładowania promptów:', data.error);
            showPromptMessage('Błąd podczas ładowania promptów: ' + data.error, 'danger');
        }
    })
    .catch(error => {
        console.error('Błąd podczas ładowania promptów:', error);
        showPromptMessage('Błąd podczas ładowania promptów: ' + error.message, 'danger');
    });
}

// Display prompts function
function displayPrompts(prompts) {
    const container = document.getElementById('promptsList');
    if (!container) return;
    
    if (!prompts || prompts.length === 0) {
        container.innerHTML = '<p class="text-muted">Brak promptów...</p>';
        return;
    }
    
    let html = '';
    prompts.forEach(prompt => {
        const activeBadge = prompt.is_active ? 
            '<span class="badge bg-success ms-2">Aktywny</span>' : 
            '<span class="badge bg-secondary ms-2">Nieaktywny</span>';
        
        html += `
            <div class="border-bottom pb-3 mb-3" 
                 data-prompt-id="${prompt.id}"
                 data-prompt-type="${prompt.prompt_type}"
                 data-prompt-title="${prompt.title.replace(/"/g, '&quot;')}"
                 data-prompt-content="${prompt.content.replace(/"/g, '&quot;')}"
                 data-prompt-active="${prompt.is_active}">
                <div class="d-flex justify-content-between align-items-start">
                    <h6 class="mb-1">${prompt.title} ${activeBadge}</h6>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="editPrompt(${prompt.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="activatePrompt(${prompt.id})" ${prompt.is_active ? 'disabled' : ''}>
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deletePrompt(${prompt.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <small class="text-muted">Typ: ${prompt.prompt_type} | Wersja: ${prompt.version} | ${new Date(prompt.created_at).toLocaleString('pl-PL')}</small>
                <div class="mt-2">
                    <strong>Treść:</strong>
                    <div class="border rounded p-2 bg-light mt-1" style="max-height: 100px; overflow-y: auto; font-size: 0.9em;">
                        ${prompt.content.substring(0, 200)}${prompt.content.length > 200 ? '...' : ''}
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Add prompt function
function addPrompt() {
    const type = document.getElementById('promptType').value;
    const title = document.getElementById('promptTitle').value;
    const content = document.getElementById('promptContent').value;
    const isActive = document.getElementById('promptActive').checked;

    if (!content.trim() || !title.trim()) {
        showPromptMessage('Proszę wypełnić wszystkie wymagane pola.', 'danger');
        return;
    }

    showLoading(true);

    fetch('/api/prompts/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt_type: type,
            title: title,
            content: content,
            is_active: isActive
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
            showPromptMessage('Prompt został dodany pomyślnie!', 'success');
            resetPromptForm();
            loadPrompts(); // Refresh prompts list
        } else {
            showPromptMessage('Błąd: ' + data.error, 'danger');
        }
    })
    .catch(error => {
        showLoading(false);
        console.error('Error adding prompt:', error);
        showPromptMessage('Błąd: ' + error.message, 'danger');
    });
}

// Edit prompt function
function editPrompt(promptId) {
    // Find the prompt data from the current prompts list
    const promptElement = document.querySelector(`[data-prompt-id="${promptId}"]`);
    if (!promptElement) {
        showPromptMessage('Nie można znaleźć danych promptu', 'danger');
        return;
    }
    
    // Get prompt data from data attributes
    const promptType = promptElement.getAttribute('data-prompt-type');
    const promptTitle = promptElement.getAttribute('data-prompt-title');
    const promptContent = promptElement.getAttribute('data-prompt-content');
    const isActive = promptElement.getAttribute('data-prompt-active') === 'true';
    
    // Populate the edit modal
    document.getElementById('editPromptId').value = promptId;
    document.getElementById('editPromptType').value = promptType;
    document.getElementById('editPromptTitle').value = promptTitle;
    document.getElementById('editPromptContent').value = promptContent;
    document.getElementById('editPromptActive').checked = isActive;
    
    // Show the modal
    const editModal = new bootstrap.Modal(document.getElementById('editPromptModal'));
    editModal.show();
}

// Update prompt function
function updatePrompt() {
    const promptId = document.getElementById('editPromptId').value;
    const promptType = document.getElementById('editPromptType').value;
    const promptTitle = document.getElementById('editPromptTitle').value;
    const promptContent = document.getElementById('editPromptContent').value;
    const isActive = document.getElementById('editPromptActive').checked;

    if (!promptContent.trim() || !promptTitle.trim()) {
        showPromptMessage('Proszę wypełnić wszystkie wymagane pola.', 'danger');
        return;
    }

    showLoading(true);

    fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: promptTitle,
            content: promptContent,
            is_active: isActive
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
            showPromptMessage('Prompt został zaktualizowany pomyślnie!', 'success');
            
            // Hide the modal
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editPromptModal'));
            editModal.hide();
            
            loadPrompts(); // Refresh prompts list
        } else {
            showPromptMessage('Błąd: ' + data.error, 'danger');
        }
    })
    .catch(error => {
        showLoading(false);
        console.error('Error updating prompt:', error);
        showPromptMessage('Błąd: ' + error.message, 'danger');
    });
}

// Activate prompt function
function activatePrompt(promptId) {
    fetch(`/api/prompts/activate/${promptId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showPromptMessage('Prompt został aktywowany pomyślnie!', 'success');
            loadPrompts(); // Refresh prompts list
        } else {
            showPromptMessage('Błąd: ' + data.error, 'danger');
        }
    })
    .catch(error => {
        console.error('Error activating prompt:', error);
        showPromptMessage('Błąd: ' + error.message, 'danger');
    });
}

// Delete prompt function
function deletePrompt(promptId) {
    if (!confirm('Czy na pewno chcesz usunąć ten prompt?')) {
        return;
    }
    
    fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showPromptMessage('Prompt został usunięty pomyślnie!', 'success');
            loadPrompts(); // Refresh prompts list
        } else {
            showPromptMessage('Błąd: ' + data.error, 'danger');
        }
    })
    .catch(error => {
        console.error('Error deleting prompt:', error);
        showPromptMessage('Błąd: ' + error.message, 'danger');
    });
}

// Show prompt message function
function showPromptMessage(message, type) {
    const messageDiv = document.getElementById('promptMessage');
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

// Reset prompt form function
function resetPromptForm() {
    const form = document.getElementById('addPromptForm');
    if (form) {
        form.reset();
    }
    
    const messageDiv = document.getElementById('promptMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
        messageDiv.classList.remove('alert-success', 'alert-danger');
        messageDiv.textContent = '';
    }
}
