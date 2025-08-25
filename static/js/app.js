let currentType = '';
let currentOriginalText = '';

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
    
    fetch('/generate_description', {
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
        } else {
            outputElement.innerHTML = '<p class="text-danger">Error: ' + data.error + '</p>';
        }
    })
    .catch(error => {
        showLoading(false);
        outputElement.innerHTML = '<p class="text-danger">Error: ' + error.message + '</p>';
    });
}

// Save as example function
function saveAsExample(type) {
    const outputElement = document.getElementById(type + 'Output');
    const text = outputElement.innerText;
    
    fetch('/add_example', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: type,
            example_text: text
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Example saved successfully!');
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
    
    fetch('/submit_correction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: currentType,
            original_text: currentOriginalText,
            corrected_text: correctedText
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
    fetch('/learning_data')
    .then(response => response.json())
    .then(data => {
        displayCorrections(data.corrections);
        displayExamples(data.examples);
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
    corrections.slice(-10).reverse().forEach(correction => {
        html += `
            <div class="border-bottom pb-2 mb-2">
                <small class="text-muted">${new Date(correction.timestamp).toLocaleString()} - ${correction.type}</small>
                <div class="mt-1">
                    <strong>Original:</strong> <span class="text-muted">${correction.original.substring(0, 100)}...</span>
                </div>
                <div class="mt-1">
                    <strong>Corrected:</strong> <span class="text-success">${correction.corrected.substring(0, 100)}...</span>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Display examples
function displayExamples(examples) {
    const container = document.getElementById('examplesList');
    if (examples.length === 0) {
        container.innerHTML = '<p class="text-muted">No examples yet...</p>';
        return;
    }
    
    let html = '';
    examples.slice(-10).reverse().forEach(example => {
        html += `
            <div class="border-bottom pb-2 mb-2">
                <small class="text-muted">${new Date(example.timestamp).toLocaleString()} - ${example.type}</small>
                <div class="mt-1">
                    ${example.text.substring(0, 150)}...
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
