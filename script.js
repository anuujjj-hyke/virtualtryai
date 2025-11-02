document.addEventListener("DOMContentLoaded", () => {
    
    // --- Global Element References ---
    const tryOnButton = document.getElementById('try-on-button');
    const personImage = document.getElementById('person-image');
    const garmentImage = document.getElementById('garment-image');

    // References for the result area (These match the new simplified HTML structure)
    const resultSlider = document.getElementById('result-slider');
    // Note: Use .src to assign image data later
    const resultAfterImage = document.getElementById('result-image-after').querySelector('img');
    const resultBeforeImage = document.getElementById('result-image-before').querySelector('img');
    const resultLabel = document.querySelector('#result-panel .upload-label');
    
    // --- 0. Notification System (Replaces alert()) ---
    function showNotification(message, type = 'info') {
        // Create a temporary notification element for user feedback
        const notificationArea = document.body;
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 20px;
            background-color: ${type === 'error' ? '#f44336' : '#00bcd4'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 2000;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
            font-family: sans-serif;
            font-size: 0.9rem;
        `;
        notification.textContent = message;
        
        notificationArea.appendChild(notification);

        // Fade in
        setTimeout(() => notification.style.opacity = 1, 10); 

        // Fade out and remove after 4 seconds
        setTimeout(() => {
            notification.style.opacity = 0;
            notification.addEventListener('transitionend', () => notification.remove());
        }, 4000);
    }


    // --- 4. Scroll-Triggered Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));


    // --- 1 & 2. Drag-and-Drop & File Preview Logic ---
    setupUploadPanel('person-panel', 'person-upload', 'person-image');
    setupUploadPanel('garment-panel', 'garment-upload', 'garment-image');

    function setupUploadPanel(panelId, inputId, imgId) {
        const panel = document.getElementById(panelId);
        const input = document.getElementById(inputId);
        const image = document.getElementById(imgId);
        const placeholder = panel.querySelector('.upload-placeholder');

        // Function to handle file selection and preview
        const handleFile = (file) => {
            if (!file || !file.type.startsWith('image/')) {
                showNotification('Invalid file type. Please upload an image.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                image.src = e.target.result;
                image.style.display = 'block';
                placeholder.style.display = 'none';
                panel.classList.add('uploaded');
            };
            reader.readAsDataURL(file);
        };

        // Trigger file input click (FIX: Always allow click to upload/replace)
        panel.addEventListener('click', () => {
             input.click();
        });

        // Handle file selection from input
        input.addEventListener('change', () => {
            if (input.files && input.files[0]) {
                handleFile(input.files[0]);
            }
        });

        // Drag & Drop Events
        panel.addEventListener('dragover', (e) => {
            e.preventDefault();
            panel.classList.add('drag-over');
        });

        panel.addEventListener('dragleave', () => {
            panel.classList.remove('drag-over');
        });

        panel.addEventListener('drop', (e) => {
            e.preventDefault();
            panel.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    
    // --- 3. Try-On Generation Logic (FIXED) ---
    tryOnButton.addEventListener('click', () => {
        // Check if both images have been uploaded by checking the src attribute
        if (personImage.src && garmentImage.src) {
            
            // 1. Prepare UI for generation (show loading state)
            resultLabel.textContent = '3. Generating Try-On...';
            tryOnButton.disabled = true;
            tryOnButton.textContent = 'Processing...';

            // Simulate the API call delay (2 seconds)
            setTimeout(() => {
                
                // --- SIMULATION OF AI RESULT ---
                // Set the 'Before' image (what the slider compares against)
                resultBeforeImage.src = personImage.src; 

                // Set the 'After' image (the generated result)
                // For demo, we simulate a try-on by copying the person image.
                // In a real app, this would be the AI-generated image URL.
                resultAfterImage.src = personImage.src; 
                
                // -------------------------------
                
                // 2. Display Result (Show the slider container)
                resultSlider.style.display = 'block';
                tryOnButton.style.display = 'none'; // Hide the button
                resultLabel.textContent = '3. Try-On Complete!';
                
                // Set the slider to 100% (fully showing the 'After' image)
                // This makes the result visible immediately.
                const sliderHandle = document.querySelector('.slider-handle');
                const sliderAfterImage = document.getElementById('result-image-after');
                sliderHandle.style.left = '100%';
                sliderAfterImage.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';


                showNotification('AI Generation Complete! Drag the slider to compare.', 'info');

            }, 2000); 

        } else {
            // Error handling if images are missing
            showNotification('Please upload both a person photo and a garment photo to generate the try-on.', 'error');
            // Reset button state if submission failed
            tryOnButton.disabled = false;
            tryOnButton.textContent = 'Generate';
            resultLabel.textContent = '3. See Your Result';

        }
    });

    
    // --- 3. "Before & After" Image Slider Logic (Reinstated and Fixed) ---
    const sliderHandle = document.querySelector('.slider-handle');
    const sliderAfterImage = document.getElementById('result-image-after');
    let isDragging = false;
    // Use the resultSlider variable defined at the top
    
    // Helper to handle both mouse and touch down
    const startDrag = () => {
        isDragging = true;
        sliderHandle.classList.add('active');
    };

    // Helper to handle both mouse and touch up
    const stopDrag = () => {
        isDragging = false;
        sliderHandle.classList.remove('active');
    };

    // Unified function to update the slider position
    const updateSlider = (clientX) => {
        if (!isDragging) return;
        
        // FIX: Use the globally defined resultSlider element
        const rect = resultSlider.getBoundingClientRect();
        let x = clientX - rect.left;

        // Constrain x within the container
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;
        
        // Convert position to percentage
        const percent = (x / rect.width) * 100;
        
        sliderHandle.style.left = `${percent}%`;
        sliderAfterImage.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`;
    };

    // Mouse events
    sliderHandle.addEventListener('mousedown', startDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('mousemove', (e) => updateSlider(e.clientX));

    // Touch events
    sliderHandle.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrag();
    });
    document.addEventListener('touchend', stopDrag);
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            updateSlider(e.touches[0].clientX);
        }
    });

});

