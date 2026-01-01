// Global variables
let alarms = JSON.parse(localStorage.getItem('alarms')) || [];
let audio;
let audioContext;
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Initialize the application
function init() {
    updateClock();
    setInterval(updateClock, 1000);
    loadAlarms();
    setupEventListeners();
    applyDarkModeOnLoad();
    
    // Initialize Web Audio API for alarm sound
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        audioContext = new (AudioContext || webkitAudioContext)();
    }
    
    // Request notification permission
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// Update the clock display
function updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('digital-clock');
    const dateElement = document.getElementById('date-display');
    
    if (timeElement && dateElement) {
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        // Format time based on 12/24 hour setting
        const is24Hour = document.getElementById('formatToggle') ? 
            document.getElementById('formatToggle').checked : false;
        
        let displayHours = hours;
        let ampm = '';
        
        if (!is24Hour) {
            ampm = hours >= 12 ? 'PM' : 'AM';
            displayHours = hours % 12;
            if (displayHours === 0) displayHours = 12;
        }
        
        const formattedTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}${ampm ? ' ' + ampm : ''}`;
        
        timeElement.textContent = formattedTime;
        
        // Format date
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
    
    // Check for active alarms
    checkAlarms(now);
}

// Setup event listeners
function setupEventListeners() {
    // Format toggle
    const formatToggle = document.getElementById('formatToggle');
    if (formatToggle) {
        formatToggle.addEventListener('change', updateClock);
    }
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleDarkMode);
    }
    
    // Alarm form submission
    const alarmForm = document.getElementById('alarmForm');
    if (alarmForm) {
        alarmForm.addEventListener('submit', handleAlarmSubmit);
    }
    
    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

// Handle alarm form submission
function handleAlarmSubmit(e) {
    e.preventDefault();
    
    const hour = document.getElementById('hour').value;
    const minute = document.getElementById('minute').value;
    const ampm = document.getElementById('ampm').value;
    
    if (!hour || !minute) {
        alert('Please select both hour and minute');
        return;
    }
    
    // Format the alarm time
    let alarmTime = `${hour}:${minute}`;
    if (ampm) {
        alarmTime += ` ${ampm}`;
    }
    
    // Create alarm object
    const alarm = {
        id: Date.now(),
        time: alarmTime,
        active: true
    };
    
    alarms.push(alarm);
    saveAlarms();
    renderAlarms();
    
    // Reset form
    document.getElementById('alarmForm').reset();
}

// Handle contact form submission
function handleContactSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Simple validation
    if (!name || !email || !message) {
        alert('Please fill in all fields');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Show success message
    const successMessage = document.querySelector('.success-message');
    if (successMessage) {
        successMessage.style.display = 'block';
        successMessage.textContent = 'Message sent successfully! We will get back to you soon.';
        
        // Reset form
        document.getElementById('contactForm').reset();
        
        // Hide message after 5 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }
}

// Validate email
function isValidEmail(email) {
    const re = /^[\w\+\.\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
}

// Save alarms to localStorage
function saveAlarms() {
    localStorage.setItem('alarms', JSON.stringify(alarms));
}

// Load alarms from localStorage
function loadAlarms() {
    alarms = JSON.parse(localStorage.getItem('alarms')) || [];
    renderAlarms();
}

// Render alarms list
function renderAlarms() {
    const alarmsList = document.getElementById('alarmsList');
    if (!alarmsList) return;
    
    alarmsList.innerHTML = '';
    
    if (alarms.length === 0) {
        alarmsList.innerHTML = '<p>No alarms set</p>';
        return;
    }
    
    alarms.forEach(alarm => {
        const alarmElement = document.createElement('div');
        alarmElement.className = 'alarm-item';
        alarmElement.innerHTML = `
            <div class="alarm-time">${alarm.time}</div>
            <div class="alarm-controls">
                <label class="toggle-switch">
                    <input type="checkbox" ${alarm.active ? 'checked' : ''} onchange="toggleAlarm(${alarm.id})">
                    <span class="slider"></span>
                </label>
                <button class="delete-btn" onclick="deleteAlarm(${alarm.id})">Delete</button>
            </div>
        `;
        alarmsList.appendChild(alarmElement);
    });
}

// Toggle alarm active state
function toggleAlarm(id) {
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
        alarm.active = !alarm.active;
        saveAlarms();
    }
}

// Delete alarm
function deleteAlarm(id) {
    alarms = alarms.filter(a => a.id !== id);
    saveAlarms();
    renderAlarms();
}

// Clear all alarms
function clearAllAlarms() {
    if (confirm('Are you sure you want to clear all alarms?')) {
        alarms = [];
        saveAlarms();
        renderAlarms();
    }
}

// Check for active alarms
function checkAlarms(now) {
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
    
    alarms.forEach(alarm => {
        if (alarm.active) {
            // Convert alarm time to 24-hour format for comparison
            let alarmTime24 = convertTo24Hour(alarm.time);
            
            if (currentTime.startsWith(alarmTime24)) {
                triggerAlarm(alarm);
            }
        }
    });
}

// Convert time to 24-hour format
function convertTo24Hour(time) {
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    
    if (modifier && modifier.toUpperCase() === 'PM' && hours !== '12') {
        hours = parseInt(hours, 10) + 12;
    }
    if (modifier && modifier.toUpperCase() === 'AM' && hours === '12') {
        hours = '00';
    }
    
    return `${hours.padStart(2, '0')}:${minutes}`;
}

// Trigger alarm
function triggerAlarm(alarm) {
    // Play sound using Web Audio API
    playAlarmSound();
    
    // Show notification
    if (Notification.permission === 'granted') {
        new Notification('Alarm!', {
            body: `Time to wake up! It's ${alarm.time}`,
            icon: './assets/alarm.png' // This is just for example, you can add an icon
        });
    }
    
    // Add visual feedback
    document.body.classList.add('alarm-active');
    
    // Stop alarm after 30 seconds
    setTimeout(() => {
        stopAlarmSound();
        document.body.classList.remove('alarm-active');
    }, 30000);
}

// Play alarm sound using Web Audio API
function playAlarmSound() {
    if (!audioContext) return;
    
    // Create oscillator for alarm sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set oscillator type and frequency
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    
    // Configure gain for volume and fade in/out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    
    oscillator.start();
    
    // Store references for stopping
    if (!window.alarmAudio) {
        window.alarmAudio = [];
    }
    window.alarmAudio.push({ oscillator, gainNode });
}

// Stop alarm sound
function stopAlarmSound() {
    if (window.alarmAudio) {
        window.alarmAudio.forEach(audioObj => {
            try {
                audioObj.gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
                audioObj.oscillator.stop(audioContext.currentTime + 0.5);
            } catch (e) {
                // Oscillator already stopped
            }
        });
        window.alarmAudio = [];
    }
}

// Toggle dark mode
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    updateDarkMode();
}

// Update dark mode styles
function updateDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = isDarkMode;
    }
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Apply dark mode on page load
function applyDarkModeOnLoad() {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    }
}

// Format time options for dropdowns
function populateTimeOptions() {
    const hourSelect = document.getElementById('hour');
    const minuteSelect = document.getElementById('minute');
    
    if (hourSelect) {
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            hourSelect.appendChild(option);
        }
    }
    
    if (minuteSelect) {
        for (let i = 0; i < 60; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i.toString().padStart(2, '0');
            minuteSelect.appendChild(option);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    populateTimeOptions();
});

// Function to snooze alarm (if currently ringing)
function snoozeAlarm() {
    stopAlarmSound();
    document.body.classList.remove('alarm-active');
    
    // Set a new alarm for 5 minutes from now
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    
    const snoozeTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const snoozeAlarm = {
        id: Date.now(),
        time: snoozeTime,
        active: true
    };
    
    alarms.push(snoozeAlarm);
    saveAlarms();
    renderAlarms();
}