let currentType = '';
let currentOriginalText = '';
let currentDescriptionId = null;
let currentSaveType = '';
let currentSaveText = '';
let currentViewDescriptionId = null;
let currentDeleteDescriptionId = null;
let currentGeneratedDescription = null;
let currentCorrectionSource = null;

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
async function saveDescription(type) {
    const outputElement = document.getElementById(type + 'Output');
    if (!outputElement) {
        console.error('Output element not found for type:', type);
        return;
    }
    
    const text = outputElement.innerText || outputElement.textContent;
    console.log('Saving description, length:', text.length);
    console.log('Full text to save:', text);
    
    // Store the current type and text for the modal
    currentSaveType = type;
    currentSaveText = text;
    
    // Try to get AI suggestions for category and tags
    let suggestedCategory = '';
    let suggestedTags = '';
    
    try {
        const response = await fetch('/api/saved-descriptions/suggest-metadata', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: text,
                type: type
            })
        });
        const data = await response.json();
        if (data.success) {
            suggestedCategory = data.category;
            suggestedTags = data.tags;
        }
    } catch (error) {
        console.log('Could not get metadata suggestions:', error);
    }
    
    // Populate the modal with suggestions
    document.getElementById('saveTitle').value = '';
    document.getElementById('saveCategory').value = suggestedCategory || '';
    document.getElementById('saveTags').value = suggestedTags || '';
    
    // Show suggestion hints
    const categorySuggestion = document.getElementById('categorySuggestion');
    const tagsSuggestion = document.getElementById('tagsSuggestion');
    
    if (suggestedCategory) {
        categorySuggestion.textContent = `Sugerowana kategoria: ${suggestedCategory}`;
        categorySuggestion.className = 'form-text text-success';
    } else {
        categorySuggestion.textContent = 'Wprowadź kategorię (np. Elektryczna, Akustyczna, Firma)';
        categorySuggestion.className = 'form-text text-muted';
    }
    
    if (suggestedTags) {
        tagsSuggestion.textContent = `Sugerowane tagi: ${suggestedTags}`;
        tagsSuggestion.className = 'form-text text-success';
    } else {
        tagsSuggestion.textContent = 'Wprowadź tagi oddzielone przecinkami (opcjonalnie)';
        tagsSuggestion.className = 'form-text text-muted';
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('saveDescriptionModal'));
    modal.show();
}

// Submit save description function
async function submitSaveDescription() {
    const title = document.getElementById('saveTitle').value.trim();
    const category = document.getElementById('saveCategory').value.trim();
    const tags = document.getElementById('saveTags').value.trim();
    const isPublic = document.getElementById('saveIsPublic').checked;
    
    if (!title || !category) {
        alert('Proszę wypełnić tytuł i kategorię.');
        return;
    }
    
    try {
        const response = await fetch('/api/saved-descriptions/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: currentSaveType,
                content: currentSaveText,
                title: title,
                category: category,
                tags: tags || '',
                is_public: isPublic
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            // Hide the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('saveDescriptionModal'));
            modal.hide();
            
            // Show success message
            showMessage('Opis został zapisany pomyślnie!', 'success');
        } else {
            showMessage('Błąd: ' + data.error, 'danger');
        }
    } catch (error) {
        console.error('Error saving description:', error);
        showMessage('Błąd: ' + error.message, 'danger');
    }
}

// View description function
async function viewDescription(descriptionId) {
    try {
        const response = await fetch(`/api/saved-descriptions/${descriptionId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) {
            throw new Error('Empty response from server');
        }
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response:', text);
            throw new Error('Invalid response format from server');
        }
        
        if (data.success) {
            const desc = data.description;
            
            // Populate the view modal
            document.getElementById('viewTitle').textContent = desc.title;
            document.getElementById('viewContent').textContent = desc.content;
            document.getElementById('viewCategory').textContent = desc.category || 'Brak kategorii';
            document.getElementById('viewTags').textContent = desc.tags || 'Brak tagów';
            document.getElementById('viewStatus').textContent = desc.is_public ? 'Aktywny (publiczny)' : 'Nieaktywny (prywatny)';
            document.getElementById('viewCreatedAt').textContent = new Date(desc.created_at).toLocaleString('pl-PL');
            
            // Update toggle button
            const toggleBtn = document.getElementById('toggleActiveBtn');
            toggleBtn.innerHTML = desc.is_public ? 
                '<i class="fas fa-toggle-on me-2"></i>Dezaktywuj' : 
                '<i class="fas fa-toggle-off me-2"></i>Aktywuj';
            toggleBtn.className = desc.is_public ? 
                'btn btn-warning' : 'btn btn-success';
            
            // Store the description ID for toggle/delete operations
            currentViewDescriptionId = descriptionId;
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('viewDescriptionModal'));
            modal.show();
        } else {
            showMessage('Błąd: ' + data.error, 'danger');
        }
    } catch (error) {
        console.error('Error viewing description:', error);
        showMessage('Błąd: ' + error.message, 'danger');
    }
}

// Toggle description active status
async function toggleDescriptionActive(descriptionId) {
    if (!descriptionId) {
        descriptionId = currentViewDescriptionId;
    }
    
    if (!descriptionId) {
        showMessage('Błąd: Brak ID opisu', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`/api/saved-descriptions/${descriptionId}/toggle-active`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            showMessage('Status opisu został zaktualizowany pomyślnie!', 'success');
            
            // Refresh the learning data to update the display
            loadLearningData();
            
            // If we're in the view modal, update the status display
            if (currentViewDescriptionId === descriptionId) {
                document.getElementById('viewStatus').textContent = data.is_public ? 'Aktywny (publiczny)' : 'Nieaktywny (prywatny)';
                const toggleBtn = document.getElementById('toggleActiveBtn');
                toggleBtn.innerHTML = data.is_public ? 
                    '<i class="fas fa-toggle-on me-2"></i>Dezaktywuj' : 
                    '<i class="fas fa-toggle-off me-2"></i>Aktywuj';
                toggleBtn.className = data.is_public ? 
                    'btn btn-warning' : 'btn btn-success';
            }
        } else {
            showMessage('Błąd: ' + data.error, 'danger');
        }
    } catch (error) {
        console.error('Error toggling description active status:', error);
        showMessage('Błąd: ' + error.message, 'danger');
    }
}

// Confirm delete description function
function confirmDeleteDescription(descriptionId) {
    if (!descriptionId) {
        descriptionId = currentViewDescriptionId;
    }
    
    if (!descriptionId) {
        showMessage('Błąd: Brak ID opisu', 'danger');
        return;
    }
    
    // Store the description ID for the actual deletion
    currentDeleteDescriptionId = descriptionId;
    
    // Get description info to show in confirmation modal
    fetch(`/api/saved-descriptions/${descriptionId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text().then(text => {
                if (!text) {
                    throw new Error('Empty response from server');
                }
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Invalid JSON response:', text);
                    throw new Error('Invalid response format from server');
                }
            });
        })
        .then(data => {
            if (data.success) {
                const desc = data.description;
                
                // Populate the confirmation modal with description info
                const infoDiv = document.getElementById('deleteDescriptionInfo');
                infoDiv.innerHTML = `
                    <div class="mb-2">
                        <strong>Tytuł:</strong> ${desc.title}
                    </div>
                    <div class="mb-2">
                        <strong>Kategoria:</strong> ${desc.category || 'Brak kategorii'}
                    </div>
                    <div class="mb-2">
                        <strong>Typ:</strong> ${desc.type === 'guitar' ? 'Gitara' : 'Firma'}
                    </div>
                    <div>
                        <strong>Treść:</strong> ${desc.content.substring(0, 100)}...
                    </div>
                `;
                
                // Show the confirmation modal
                const modal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
                modal.show();
            } else {
                // Try debug endpoint to get more information
                console.log('Main endpoint failed, trying debug endpoint...');
                return fetch(`/api/saved-descriptions/debug/${descriptionId}`)
                    .then(response => response.json())
                    .then(debugData => {
                        console.log('Debug data:', debugData);
                        showMessage('Błąd: ' + data.error + ' (Debug: ' + JSON.stringify(debugData) + ')', 'danger');
                    })
                    .catch(debugError => {
                        showMessage('Błąd: ' + data.error + ' (Debug failed: ' + debugError.message + ')', 'danger');
                    });
            }
        })
        .catch(error => {
            console.error('Error fetching description for deletion:', error);
            showMessage('Błąd: ' + error.message, 'danger');
        });
}

// Execute delete description function
async function executeDeleteDescription() {
    const descriptionId = currentDeleteDescriptionId;
    
    if (!descriptionId) {
        showMessage('Błąd: Brak ID opisu', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`/api/saved-descriptions/${descriptionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            showMessage('Opis został usunięty pomyślnie!', 'success');
            
            // Close both modals
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal'));
            if (deleteModal) {
                deleteModal.hide();
            }
            
            const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewDescriptionModal'));
            if (viewModal) {
                viewModal.hide();
            }
            
            // Refresh the learning data to update the display
            loadLearningData();
        } else {
            showMessage('Błąd: ' + data.error, 'danger');
        }
    } catch (error) {
        console.error('Error deleting description:', error);
        showMessage('Błąd: ' + error.message, 'danger');
    }
}

// View generated description function
async function viewGeneratedDescription(descriptionId) {
    try {
        const response = await fetch(`/api/descriptions/${descriptionId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) {
            throw new Error('Empty response from server');
        }
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response:', text);
            throw new Error('Invalid response format from server');
        }
        
        if (data.success) {
            const desc = data.description;
            
            // Store the current description for save functionality
            currentGeneratedDescription = desc;
            
            // Populate the view modal
            document.getElementById('viewInputText').textContent = desc.input_text;
            document.getElementById('viewGeneratedContent').textContent = desc.generated_description;
            document.getElementById('viewGeneratedType').textContent = desc.type === 'guitar' ? 'Gitara' : 'Firma';
            document.getElementById('viewGeneratedTimestamp').textContent = new Date(desc.created_at).toLocaleString('pl-PL');
            document.getElementById('viewTokensUsed').textContent = desc.tokens_used || 'Brak danych';
            document.getElementById('viewProcessingTime').textContent = desc.processing_time ? 
                `${desc.processing_time.toFixed(2)}s` : 'Brak danych';
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('viewGeneratedDescriptionModal'));
            modal.show();
        } else {
            showMessage('Błąd: ' + data.error, 'danger');
        }
    } catch (error) {
        console.error('Error viewing generated description:', error);
        showMessage('Błąd: ' + error.message, 'danger');
    }
}

// Save generated description as example
async function saveGeneratedDescription() {
    if (!currentGeneratedDescription) {
        showMessage('Błąd: Brak danych do zapisania', 'danger');
        return;
    }
    
    // Store the current description data for the save modal
    currentSaveType = currentGeneratedDescription.type;
    currentSaveText = currentGeneratedDescription.generated_description;
    
    // Try to get AI suggestions for category and tags
    let suggestedCategory = '';
    let suggestedTags = '';
    
    try {
        const response = await fetch('/api/saved-descriptions/suggest-metadata', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: currentGeneratedDescription.generated_description,
                type: currentGeneratedDescription.type
            })
        });
        const data = await response.json();
        if (data.success) {
            suggestedCategory = data.category;
            suggestedTags = data.tags;
        }
    } catch (error) {
        console.log('Could not get metadata suggestions:', error);
    }
    
    // Populate the save modal with suggestions
    document.getElementById('saveTitle').value = currentGeneratedDescription.input_text.substring(0, 50) + '...';
    document.getElementById('saveCategory').value = suggestedCategory || '';
    document.getElementById('saveTags').value = suggestedTags || '';
    
    // Show suggestion hints
    const categorySuggestion = document.getElementById('categorySuggestion');
    const tagsSuggestion = document.getElementById('tagsSuggestion');
    
    if (suggestedCategory) {
        categorySuggestion.textContent = `Sugerowana kategoria: ${suggestedCategory}`;
        categorySuggestion.className = 'form-text text-success';
    } else {
        categorySuggestion.textContent = 'Wprowadź kategorię (np. Elektryczna, Akustyczna, Firma)';
        categorySuggestion.className = 'form-text text-muted';
    }
    
    if (suggestedTags) {
        tagsSuggestion.textContent = `Sugerowane tagi: ${suggestedTags}`;
        tagsSuggestion.className = 'form-text text-success';
    } else {
        tagsSuggestion.textContent = 'Wprowadź tagi oddzielone przecinkami (opcjonalnie)';
        tagsSuggestion.className = 'form-text text-muted';
    }
    
    // Close the view modal and show the save modal
    const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewGeneratedDescriptionModal'));
    if (viewModal) {
        viewModal.hide();
    }
    
    const saveModal = new bootstrap.Modal(document.getElementById('saveDescriptionModal'));
    saveModal.show();
}

// Copy generated description to clipboard
async function copyToClipboard() {
    if (!currentGeneratedDescription) {
        showMessage('Błąd: Brak danych do skopiowania', 'danger');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(currentGeneratedDescription.generated_description);
        showMessage('Opis został skopiowany do schowka!', 'success');
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showMessage('Błąd podczas kopiowania do schowka', 'danger');
    }
}

// Correct generated description function
function correctGeneratedDescription() {
    if (!currentGeneratedDescription) {
        showMessage('Błąd: Brak danych do poprawienia', 'danger');
        return;
    }
    
    // Set the correction context for generated descriptions
    currentType = currentGeneratedDescription.type;
    currentOriginalText = currentGeneratedDescription.generated_description;
    currentDescriptionId = currentGeneratedDescription.id;
    currentCorrectionSource = 'generated'; // Flag to indicate this is from generated description
    
    // Populate the correction modal
    const originalTextDiv = document.getElementById('originalText');
    const correctedTextArea = document.getElementById('correctedText');
    const correctionNotesArea = document.getElementById('correctionNotes');
    
    if (originalTextDiv && correctedTextArea) {
        originalTextDiv.innerText = currentOriginalText;
        correctedTextArea.value = currentOriginalText;
        correctionNotesArea.value = ''; // Clear any previous notes
        
        // Close the view modal and show the correction modal
        const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewGeneratedDescriptionModal'));
        if (viewModal) {
            viewModal.hide();
        }
        
        const modal = new bootstrap.Modal(document.getElementById('correctionModal'));
        modal.show();
    } else {
        console.error('Modal elements not found');
        showMessage('Błąd: Nie można otworzyć modalu poprawki', 'danger');
    }
}

// Correct generated description from list function
async function correctGeneratedDescriptionFromList(descriptionId) {
    try {
        const response = await fetch(`/api/descriptions/${descriptionId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) {
            throw new Error('Empty response from server');
        }
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response:', text);
            throw new Error('Invalid response format from server');
        }
        
        if (data.success) {
            const desc = data.description;
            
            // Set the correction context for generated descriptions
            currentType = desc.type;
            currentOriginalText = desc.generated_description;
            currentDescriptionId = desc.id;
            currentCorrectionSource = 'generated'; // Flag to indicate this is from generated description
            
            // Populate the correction modal
            const originalTextDiv = document.getElementById('originalText');
            const correctedTextArea = document.getElementById('correctedText');
            const correctionNotesArea = document.getElementById('correctionNotes');
            
            if (originalTextDiv && correctedTextArea) {
                originalTextDiv.innerText = currentOriginalText;
                correctedTextArea.value = currentOriginalText;
                correctionNotesArea.value = ''; // Clear any previous notes
                
                const modal = new bootstrap.Modal(document.getElementById('correctionModal'));
                modal.show();
            } else {
                console.error('Modal elements not found');
                showMessage('Błąd: Nie można otworzyć modalu poprawki', 'danger');
            }
        } else {
            showMessage('Błąd: ' + data.error, 'danger');
        }
    } catch (error) {
        console.error('Error fetching description for correction:', error);
        showMessage('Błąd: ' + error.message, 'danger');
    }
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
    
    // Set the correction context for current generation
    currentType = type;
    currentOriginalText = originalText;
    currentCorrectionSource = 'current'; // Flag to indicate this is from current generation
    
    const originalTextDiv = document.getElementById('originalText');
    const correctedTextArea = document.getElementById('correctedText');
    const correctionNotesArea = document.getElementById('correctionNotes');
    
    if (originalTextDiv && correctedTextArea) {
        originalTextDiv.innerText = originalText;
        correctedTextArea.value = originalText;
        correctionNotesArea.value = ''; // Clear any previous notes
        
        const modal = new bootstrap.Modal(document.getElementById('correctionModal'));
        modal.show();
    } else {
        console.error('Modal elements not found');
    }
}

// Submit correction function
async function submitCorrection() {
    const correctedTextArea = document.getElementById('correctedText');
    const correctionNotesArea = document.getElementById('correctionNotes');
    
    if (!correctedTextArea) {
        console.error('Corrected text area not found');
        return;
    }
    
    const correctedText = correctedTextArea.value;
    const correctionNotes = correctionNotesArea ? correctionNotesArea.value : '';
    
    if (!correctedText.trim()) {
        showMessage('Proszę wprowadzić poprawiony tekst.', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/corrections/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                original_text: currentOriginalText,
                corrected_text: correctedText,
                type: currentType,
                description_id: currentDescriptionId,
                notes: correctionNotes
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            showMessage('Poprawka została zatwierdzona pomyślnie!', 'success');
            
            // Close the correction modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('correctionModal'));
            if (modal) {
                modal.hide();
            }
            
            // If this was from a generated description, refresh the learning data
            if (currentCorrectionSource === 'generated') {
                loadLearningData();
            }
            
            // Reset correction context
            currentCorrectionSource = null;
        } else {
            showMessage('Błąd: ' + data.error, 'danger');
        }
    } catch (error) {
        console.error('Error submitting correction:', error);
        showMessage('Błąd: ' + error.message, 'danger');
    }
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
        const activeBadge = desc.is_public ? 
            '<span class="badge bg-success ms-2">Aktywny</span>' : 
            '<span class="badge bg-secondary ms-2">Nieaktywny</span>';
        
        const categoryBadge = desc.category ? 
            `<span class="badge bg-info me-1">${desc.category}</span>` : '';
        
        html += `
            <div class="border-bottom pb-2 mb-2" data-description-id="${desc.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <small class="text-muted">${new Date(desc.timestamp).toLocaleString('pl-PL')} - ${desc.title} ${activeBadge}</small>
                        <div class="mt-1">
                            ${categoryBadge}
                            ${desc.content.substring(0, 150)}...
                        </div>
                    </div>
                    <div class="btn-group btn-group-sm ms-2">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewDescription(${desc.id})" title="Podgląd">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="toggleDescriptionActive(${desc.id})" title="${desc.is_public ? 'Dezaktywuj' : 'Aktywuj'}">
                            <i class="fas fa-${desc.is_public ? 'toggle-on' : 'toggle-off'}"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="confirmDeleteDescription(${desc.id})" title="Usuń">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
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
        const typeBadge = desc.type === 'guitar' ? 
            '<span class="badge bg-primary me-1">Gitara</span>' : 
            '<span class="badge bg-info me-1">Firma</span>';
        
        html += `
            <div class="border-bottom pb-2 mb-2" data-description-id="${desc.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <small class="text-muted">${new Date(desc.timestamp).toLocaleString('pl-PL')} ${typeBadge}</small>
                        <div class="mt-1">
                            ${desc.generated_description.substring(0, 150)}...
                        </div>
                    </div>
                    <div class="btn-group btn-group-sm ms-2">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewGeneratedDescription(${desc.id})" title="Podgląd">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-sm" onclick="correctGeneratedDescriptionFromList(${desc.id})" title="Popraw">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
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

// Show message function
function showMessage(message, type = 'info') {
    // Create a temporary alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to body
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
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
