let currentType = '';
let currentOriginalText = '';
let currentDescriptionId = null;

// Load learning data when learning tab is shown
document.addEventListener('DOMContentLoaded', function() {
    const learningTab = document.getElementById('learning-tab');
    if (learningTab) {
        learningTab.addEventListener('click', function() {
            loadLearningData();
        });
    }
});

// Generate description function
function generateDescription(type) {
    const inputElement = document.getElementById(type + 'Input');
    const outputElement = document.getElementById(type + 'Output');
    const actionsElement = document.getElementById(type + 'Actions');
    
    if (!inputElement.value.trim()) {
        alert('Please enter some information first.');
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
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        if (data.success) {
            outputElement.innerHTML = data.description.replace(/\n/g, '<br>');
            actionsElement.style.display = 'block';
            currentType = type;
            currentOriginalText = data.description;
            currentDescriptionId = data.description_id;
        } else {
            outputElement.innerHTML = '<p class="text-danger">Error: ' + data.error + '</p>';
        }
    })
    .catch(error => {
        showLoading(false);
        outputElement.innerHTML = '<p class="text-danger">Error: ' + error.message + '</p>';
    });
}

// Save description function
function saveDescription(type) {
    const outputElement = document.getElementById(type + 'Output');
    const text = outputElement.innerText;
    
    // Prompt for title and category
    const title = prompt('Enter a title for this description:');
    if (!title) return;
    
    const category = prompt('Enter a category (optional):');
    const tags = prompt('Enter tags separated by commas (optional):').split(',').map(t => t.trim()).filter(t => t);
    
    fetch('/api/saved-descriptions/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            content: text,
            type: type,
            category: category || '',
            tags: tags,
            is_public: false
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Description saved successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        alert('Error: ' + error.message);
    });
}

// Enable correction function
function enableCorrection(type) {
    const outputElement = document.getElementById(type + 'Output');
    const originalText = outputElement.innerText;
    
    document.getElementById('originalText').innerHTML = originalText.replace(/\n/g, '<br>');
    document.getElementById('correctedText').value = originalText;
    currentType = type;
    currentOriginalText = originalText;
    
    new bootstrap.Modal(document.getElementById('correctionModal')).show();
}

// Submit correction function
function submitCorrection() {
    const correctedText = document.getElementById('correctedText').value;
    const correctionType = document.getElementById('correctionType') ? document.getElementById('correctionType').value : 'general';
    const notes = document.getElementById('correctionNotes') ? document.getElementById('correctionNotes').value : '';
    
    fetch('/api/corrections/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: currentType,
            original_text: currentOriginalText,
            corrected_text: correctedText,
            description_id: currentDescriptionId,
            correction_type: correctionType,
            notes: notes
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Correction saved successfully!');
            bootstrap.Modal.getInstance(document.getElementById('correctionModal')).hide();
            
            // Update the output with corrected text
            const outputElement = document.getElementById(currentType + 'Output');
            outputElement.innerHTML = correctedText.replace(/\n/g, '<br>');
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        alert('Error: ' + error.message);
    });
}

// Load learning data function
function loadLearningData() {
    fetch('/api/learning-data/dashboard')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayCorrections(data.corrections);
            displaySavedDescriptions(data.saved_descriptions);
            displayReturnedDescriptions(data.returned_descriptions);
        } else {
            console.error('Error loading learning data:', data.error);
        }
    })
    .catch(error => {
        console.error('Error loading learning data:', error);
    });
}

// Display corrections
function displayCorrections(corrections) {
    const container = document.getElementById('correctionsList');
    if (corrections.length === 0) {
        container.innerHTML = '<p class="text-muted">No corrections yet...</p>';
        return;
    }
    
    let html = '';
    corrections.forEach(correction => {
        html += `
            <div class="border-bottom pb-2 mb-2">
                <small class="text-muted">${new Date(correction.timestamp).toLocaleString()} - ${correction.type}</small>
                <div class="mt-1">
                    <strong>Original:</strong> <span class="text-muted">${correction.original.substring(0, 100)}...</span>
                </div>
                <div class="mt-1">
                    <strong>Corrected:</strong> <span class="text-success">${correction.corrected.substring(0, 100)}...</span>
                </div>
                ${correction.notes ? `<div class="mt-1"><small class="text-info">Notes: ${correction.notes}</small></div>` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

// Display saved descriptions
function displaySavedDescriptions(savedDescriptions) {
    const container = document.getElementById('savedDescriptionsList');
    if (!container) return;
    
    if (savedDescriptions.length === 0) {
        container.innerHTML = '<p class="text-muted">No saved descriptions yet...</p>';
        return;
    }
    
    let html = '';
    savedDescriptions.forEach(desc => {
        html += `
            <div class="border-bottom pb-2 mb-2">
                <small class="text-muted">${new Date(desc.timestamp).toLocaleString()} - ${desc.type}</small>
                <div class="mt-1">
                    <strong>${desc.title}</strong>
                </div>
                <div class="mt-1">
                    ${desc.content.substring(0, 150)}...
                </div>
                ${desc.category ? `<div class="mt-1"><small class="text-primary">Category: ${desc.category}</small></div>` : ''}
                ${desc.tags.length > 0 ? `<div class="mt-1"><small class="text-secondary">Tags: ${desc.tags.join(', ')}</small></div>` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

// Display returned descriptions
function displayReturnedDescriptions(returnedDescriptions) {
    const container = document.getElementById('returnedDescriptionsList');
    if (!container) return;
    
    if (returnedDescriptions.length === 0) {
        container.innerHTML = '<p class="text-muted">No generated descriptions yet...</p>';
        return;
    }
    
    let html = '';
    returnedDescriptions.forEach(desc => {
        html += `
            <div class="border-bottom pb-2 mb-2">
                <small class="text-muted">${new Date(desc.timestamp).toLocaleString()} - ${desc.type}</small>
                <div class="mt-1">
                    <strong>Input:</strong> <span class="text-muted">${desc.input_text.substring(0, 100)}...</span>
                </div>
                <div class="mt-1">
                    <strong>Generated:</strong> <span class="text-success">${desc.generated_description.substring(0, 150)}...</span>
                </div>
                ${desc.processing_time ? `<div class="mt-1"><small class="text-info">Processing time: ${desc.processing_time.toFixed(2)}s</small></div>` : ''}
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
