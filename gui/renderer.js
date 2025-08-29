// DOM elements
const generateSingleBtn = document.getElementById('generate-single');
const generateTwoBtn = document.getElementById('generate-two');
const testVoiceBtn = document.getElementById('test-voice');
const checkYoutubeBtn = document.getElementById('check-youtube');
const refreshLogsBtn = document.getElementById('refresh-logs');
const statusMessage = document.getElementById('status-message');
const progressBar = document.getElementById('progress-bar');
const liveOutput = document.getElementById('live-output');
const logDisplay = document.getElementById('log-display');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// File management elements
const organizeFilesBtn = document.getElementById('organize-files');
const cleanOldFilesBtn = document.getElementById('clean-old-files');
const archiveWeekBtn = document.getElementById('archive-week');
const fileTypeTabs = document.querySelectorAll('.file-tab-btn');
const fileList = document.getElementById('file-list');

// State management
let isProcessing = false;
let currentFileType = 'videos';

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        switchTab(targetTab);
    });
});

function switchTab(targetTab) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === targetTab);
    });
    
    // Update tab content
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${targetTab}-tab`);
    });
    
    // Load content for specific tabs
    if (targetTab === 'files') {
        loadFileManagerData();
    } else if (targetTab === 'stats') {
        loadStatisticsData();
    }
}

// File type tab switching
fileTypeTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        const fileType = btn.dataset.type;
        switchFileType(fileType);
    });
});

function switchFileType(fileType) {
    currentFileType = fileType;
    
    fileTypeTabs.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === fileType);
    });
    
    loadFileList(fileType);
}

// Button event listeners
generateSingleBtn.addEventListener('click', () => {
    if (!isProcessing) {
        generateVideos('single');
    }
});

generateTwoBtn.addEventListener('click', () => {
    if (!isProcessing) {
        generateVideos('two');
    }
});

testVoiceBtn.addEventListener('click', () => {
    if (!isProcessing) {
        testVoice();
    }
});

checkYoutubeBtn.addEventListener('click', () => {
    if (!isProcessing) {
        checkYouTubeConnection();
    }
});

refreshLogsBtn.addEventListener('click', () => {
    refreshLogs();
});

// File management event listeners
organizeFilesBtn.addEventListener('click', () => {
    organizeFiles();
});

cleanOldFilesBtn.addEventListener('click', () => {
    cleanOldFiles();
});

archiveWeekBtn.addEventListener('click', () => {
    archiveWeek();
});

// Main functions
async function generateVideos(type) {
    try {
        setProcessing(true);
        updateStatus('working', `Generating ${type === 'single' ? '1 video' : '2 videos'}...`);
        clearLiveOutput();
        
        const result = type === 'single' 
            ? await window.electronAPI.generateSingleVideo()
            : await window.electronAPI.generateTwoVideos();
        
        if (result.success) {
            updateStatus('success', `Successfully generated ${type === 'single' ? '1 video' : '2 videos'}!`);
            setProgress(100);
            
            // Refresh file manager if it's open
            if (document.getElementById('files-tab').classList.contains('active')) {
                setTimeout(() => loadFileManagerData(), 1000);
            }
        } else {
            updateStatus('error', `Failed to generate videos: ${result.error || 'Unknown error'}`);
            console.error('Generation failed:', result);
        }
    } catch (error) {
        updateStatus('error', `Error: ${error.message}`);
        console.error('Generation error:', error);
    } finally {
        setProcessing(false);
        setTimeout(() => {
            setProgress(0);
            refreshLogs();
        }, 2000);
    }
}

async function testVoice() {
    try {
        setProcessing(true);
        updateStatus('working', 'Testing voice synthesis...');
        
        const result = await window.electronAPI.testVoice();
        
        if (result.success) {
            updateStatus('success', 'Voice test completed successfully!');
        } else {
            updateStatus('error', `Voice test failed: ${result.error || 'Unknown error'}`);
        }
        
        // Show output in logs
        if (result.output) {
            appendToLiveOutput(result.output);
        }
        if (result.error) {
            appendToLiveOutput(`ERROR: ${result.error}`);
        }
    } catch (error) {
        updateStatus('error', `Voice test error: ${error.message}`);
    } finally {
        setProcessing(false);
    }
}

async function checkYouTubeConnection() {
    try {
        setProcessing(true);
        updateStatus('working', 'Checking YouTube connection...');
        
        const result = await window.electronAPI.checkYoutube();
        
        if (result.success) {
            updateStatus('success', 'YouTube connection is working!');
        } else {
            updateStatus('error', `YouTube connection failed: ${result.error || 'Unknown error'}`);
        }
        
        // Show output in logs
        if (result.output) {
            appendToLiveOutput(result.output);
        }
        if (result.error) {
            appendToLiveOutput(`ERROR: ${result.error}`);
        }
    } catch (error) {
        updateStatus('error', `YouTube check error: ${error.message}`);
    } finally {
        setProcessing(false);
    }
}

async function refreshLogs() {
    try {
        const result = await window.electronAPI.getLogs();
        
        if (result.success) {
            logDisplay.textContent = result.logs;
            logDisplay.scrollTop = logDisplay.scrollHeight;
        } else {
            logDisplay.textContent = `Error loading logs: ${result.error}`;
        }
    } catch (error) {
        logDisplay.textContent = `Error refreshing logs: ${error.message}`;
    }
}

// File Management Functions
async function loadFileManagerData() {
    try {
        // Load storage stats
        const statsResult = await window.electronAPI.getStorageStats();
        if (statsResult.success) {
            document.getElementById('storage-info').innerHTML = `
                <div>Total Size: ${statsResult.totalSize} MB</div>
                <div>Total Files: ${statsResult.totalFiles}</div>
            `;
            document.getElementById('video-count').textContent = `${statsResult.videoCount} files`;
            document.getElementById('audio-count').textContent = `${statsResult.audioCount} files`;
            document.getElementById('stock-count').textContent = `${statsResult.stockCount} files`;
        }
        
        // Load current file list
        loadFileList(currentFileType);
    } catch (error) {
        console.error('Error loading file manager data:', error);
    }
}

async function loadFileList(fileType) {
    try {
        fileList.innerHTML = 'Loading...';
        
        const result = await window.electronAPI.getFileList(fileType);
        
        if (result.success) {
            if (result.files.length === 0) {
                fileList.innerHTML = `<div class="no-files">No ${fileType} found</div>`;
                return;
            }
            
            const fileItems = result.files.map(file => `
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${file.size} MB • ${new Date(file.created).toLocaleDateString()}</div>
                    </div>
                    <button class="file-actions-btn" onclick="deleteFilePrompt('${file.path}', '${file.name}')">
                        Delete
                    </button>
                </div>
            `).join('');
            
            fileList.innerHTML = fileItems;
        } else {
            fileList.innerHTML = `<div class="error">Error: ${result.error}</div>`;
        }
    } catch (error) {
        fileList.innerHTML = `<div class="error">Error loading files: ${error.message}</div>`;
    }
}

async function organizeFiles() {
    try {
        organizeFilesBtn.disabled = true;
        organizeFilesBtn.textContent = 'Organizing...';
        
        const result = await window.electronAPI.organizeFiles();
        
        if (result.success) {
            updateStatus('success', `Organized ${result.movedCount} files by date`);
            loadFileManagerData();
        } else {
            updateStatus('error', `Organization failed: ${result.error}`);
        }
    } catch (error) {
        updateStatus('error', `Organization error: ${error.message}`);
    } finally {
        organizeFilesBtn.disabled = false;
        organizeFilesBtn.innerHTML = '<span class="btn-icon">📁</span>Organize by Date';
    }
}

async function cleanOldFiles() {
    try {
        if (!confirm('This will delete files older than 3 days (keeping at least 2 of each type). Continue?')) {
            return;
        }
        
        cleanOldFilesBtn.disabled = true;
        cleanOldFilesBtn.textContent = 'Cleaning...';
        
        const result = await window.electronAPI.cleanOldFiles();
        
        if (result.success) {
            updateStatus('success', `Cleaned ${result.deletedCount} old files`);
            loadFileManagerData();
        } else {
            updateStatus('error', `Cleanup failed: ${result.error}`);
        }
    } catch (error) {
        updateStatus('error', `Cleanup error: ${error.message}`);
    } finally {
        cleanOldFilesBtn.disabled = false;
        cleanOldFilesBtn.innerHTML = '<span class="btn-icon">🧹</span>Clean Old Files';
    }
}

async function archiveWeek() {
    try {
        archiveWeekBtn.disabled = true;
        archiveWeekBtn.textContent = 'Archiving...';
        
        const result = await window.electronAPI.archiveWeek();
        
        if (result.success) {
            updateStatus('success', `Archived ${result.archivedCount} files`);
            loadFileManagerData();
        } else {
            updateStatus('error', `Archive failed: ${result.error}`);
        }
    } catch (error) {
        updateStatus('error', `Archive error: ${error.message}`);
    } finally {
        archiveWeekBtn.disabled = false;
        archiveWeekBtn.innerHTML = '<span class="btn-icon">📦</span>Archive This Week';
    }
}

window.deleteFilePrompt = async function(filePath, fileName) {
    if (!confirm(`Delete ${fileName}?`)) {
        return;
    }
    
    try {
        const result = await window.electronAPI.deleteFile(filePath);
        
        if (result.success) {
            updateStatus('success', `Deleted ${fileName}`);
            loadFileList(currentFileType);
            loadFileManagerData(); // Refresh stats
        } else {
            updateStatus('error', `Delete failed: ${result.error}`);
        }
    } catch (error) {
        updateStatus('error', `Delete error: ${error.message}`);
    }
};

async function loadStatisticsData() {
    try {
        const result = await window.electronAPI.getUsageStats();
        
        if (result.success) {
            const stats = result.stats;
            
            document.getElementById('daily-usage').innerHTML = `
                <div class="usage-stat">
                    <span>Date:</span>
                    <span>${stats.date}</span>
                </div>
                <div class="usage-stat ${stats.pixabayUsed >= stats.pixabayLimit ? 'warning' : 'success'}">
                    <span>Pixabay API Usage:</span>
                    <span>${stats.pixabayUsed}/${stats.pixabayLimit}</span>
                </div>
                <div class="usage-stat">
                    <span>Videos Generated:</span>
                    <span>${stats.videosGenerated}</span>
                </div>
                <div class="usage-stat ${stats.canUsePixabay ? 'success' : 'warning'}">
                    <span>Status:</span>
                    <span>${stats.canUsePixabay ? 'Can use Pixabay' : 'Using existing videos'}</span>
                </div>
            `;
            
            document.getElementById('api-usage').innerHTML = `
                <div class="usage-stat">
                    <span>Pixabay Remaining:</span>
                    <span>${stats.pixabayRemaining} calls</span>
                </div>
            `;
        } else {
            document.getElementById('daily-usage').textContent = `Error: ${result.error}`;
        }
    } catch (error) {
        document.getElementById('daily-usage').textContent = `Error: ${error.message}`;
    }
}

// UI helper functions
function setProcessing(processing) {
    isProcessing = processing;
    
    // Disable/enable buttons
    generateSingleBtn.disabled = processing;
    generateTwoBtn.disabled = processing;
    testVoiceBtn.disabled = processing;
    checkYoutubeBtn.disabled = processing;
    
    // Update button text
    if (processing) {
        generateSingleBtn.innerHTML = '<span class="btn-icon">⏳</span>Processing...';
        generateTwoBtn.innerHTML = '<span class="btn-icon">⏳</span>Processing...';
        testVoiceBtn.innerHTML = '<span class="btn-icon">⏳</span>Testing...';
        checkYoutubeBtn.innerHTML = '<span class="btn-icon">⏳</span>Checking...';
    } else {
        generateSingleBtn.innerHTML = '<span class="btn-icon">🎯</span>Generate 1 Video';
        generateTwoBtn.innerHTML = '<span class="btn-icon">🎬</span>Generate 2 Videos';
        testVoiceBtn.innerHTML = '<span class="btn-icon">🎤</span>Test Voice';
        checkYoutubeBtn.innerHTML = '<span class="btn-icon">📺</span>Check YouTube';
    }
}

function updateStatus(type, message) {
    statusMessage.className = `status-${type}`;
    statusMessage.textContent = message;
}

function setProgress(percent) {
    progressBar.style.width = `${percent}%`;
}

function clearLiveOutput() {
    liveOutput.textContent = '';
}

function appendToLiveOutput(text) {
    liveOutput.textContent += text;
    liveOutput.scrollTop = liveOutput.scrollHeight;
}

// Real-time output listeners
window.electronAPI.onPipelineOutput((event, data) => {
    appendToLiveOutput(data);
    
    // Simple progress detection based on output
    if (data.includes('Generating script')) {
        setProgress(20);
    } else if (data.includes('Generating voice')) {
        setProgress(40);
    } else if (data.includes('Generating assets')) {
        setProgress(60);
    } else if (data.includes('Rendering video')) {
        setProgress(80);
    } else if (data.includes('Uploading')) {
        setProgress(90);
    }
});

window.electronAPI.onPipelineError((event, data) => {
    appendToLiveOutput(`ERROR: ${data}`);
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    updateStatus('idle', 'Ready to generate videos');
    refreshLogs();
    
    // Set default file type
    switchFileType('videos');
});

// Cleanup listeners when the window is closed
window.addEventListener('beforeunload', () => {
    window.electronAPI.removeAllListeners('pipeline-output');
    window.electronAPI.removeAllListeners('pipeline-error');
});
