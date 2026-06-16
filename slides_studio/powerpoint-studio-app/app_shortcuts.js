/* ==========================================================================
   Keynote Studio App Controller
   ========================================================================== */

let obs = new OBSWebSocket();
let obsConnected = false;
let sseSource = null;
let slidesTable = null;
let slidesData = [];
let activeSlideIndex = null;
let selectedSlideIndex = null;

let pollInterval = null;
let currentOBSScene = "";
let lastCurrentError = "";
let lastNextError = "";
let obsScenes = [];

// Teleprompter State
let isPrompterScrolling = false;
let prompterScrollTimer = null;

// ==========================================================================
// Initialization & Lifecycle
// ==========================================================================
window.addEventListener('DOMContentLoaded', async () => {
    loadSettings();
    initUI();
    initTabulator();
    connectCablesSSE();
    await loadObsCredentials();
    connectOBS();

    // Initial sync request
    setTimeout(() => {
        syncKeynoteData();
    }, 1000);
});

// ==========================================================================
// UI & Layout Management
// ==========================================================================
function initUI() {
    // Layout view selectors
    const layoutSelect = document.getElementById('layout-select');
    layoutSelect.addEventListener('change', (e) => {
        switchLayout(e.target.value);
    });

    // Sidebar editor save
    const btnSaveScene = document.getElementById('btn-save-scene');
    if (btnSaveScene) {
        btnSaveScene.addEventListener('click', saveSlideSceneMapping);
    }

    // Sync button
    document.getElementById('btn-sync-keynote').addEventListener('click', syncKeynoteData);

    // Set Scene button
    const btnSetScene = document.getElementById('btn-set-scene');
    if (btnSetScene) {
        btnSetScene.addEventListener('click', setSlideSceneFromOBS);
    }

    // OBS Settings connect/apply buttons
    document.getElementById('btn-connect-obs').addEventListener('click', toggleOBSConnection);
    document.getElementById('btn-save-settings').addEventListener('click', applyCaptureSettings);

    // Teleprompter controls (guarded for iframe fallback)
    const fontSizeSlider = document.getElementById('prompter-font-size');
    const speedSlider = document.getElementById('prompter-speed');
    const prompterText = document.getElementById('prompter-text');

    if (fontSizeSlider && prompterText) {
        fontSizeSlider.addEventListener('input', (e) => {
            const fontValEl = document.getElementById('prompter-font-size-val');
            if (fontValEl) fontValEl.innerText = e.target.value + 'px';
            prompterText.style.fontSize = e.target.value + 'px';
            saveLocalSetting('prompter-font-size', e.target.value);
        });
    }

    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            const speedValEl = document.getElementById('prompter-speed-val');
            if (speedValEl) speedValEl.innerText = e.target.value;
            saveLocalSetting('prompter-speed', e.target.value);
        });
    }

    const prompterAutoScrollEl = document.getElementById('prompter-auto-scroll');
    if (prompterAutoScrollEl) {
        prompterAutoScrollEl.addEventListener('change', (e) => {
            saveLocalSetting('prompter-auto-scroll', e.target.checked ? 'true' : 'false');
        });
    }

    const btnPrompterToggle = document.getElementById('btn-prompter-toggle');
    if (btnPrompterToggle) {
        btnPrompterToggle.addEventListener('click', togglePrompterScroll);
    }
    
    const btnPrompterReset = document.getElementById('btn-prompter-reset');
    if (btnPrompterReset) {
        btnPrompterReset.addEventListener('click', resetPrompterScroll);
    }

    // Dynamic key listeners for relative navigation
    window.addEventListener('keydown', handleKeyNavigation);
}

function switchLayout(layoutName) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));

    if (layoutName === 'studio') {
        document.getElementById('studio-view').classList.add('active');
        if (slidesTable) slidesTable.redraw(true);
    } else if (layoutName === 'teleprompter') {
        document.getElementById('teleprompter-view').classList.add('active');
        resetPrompterScroll();
    } else if (layoutName === 'settings') {
        document.getElementById('settings-view').classList.add('active');
    }
}

// ==========================================================================
// Persistence
// ==========================================================================
function saveLocalSetting(key, val) {
    localStorage.setItem(`keynote_studio_${key}`, val);
}

function getLocalSetting(key, defaultVal) {
    const val = localStorage.getItem(`keynote_studio_${key}`);
    return val !== null ? val : defaultVal;
}

function loadSettings() {
    document.getElementById('obs-ip').value = getLocalSetting('obs-ip', '127.0.0.1:4455');
    document.getElementById('obs-password').value = getLocalSetting('obs-password', '');
    document.getElementById('obs-source-current').value = getLocalSetting('obs-source-current', 'Keynote Presentation');
    document.getElementById('obs-source-next').value = getLocalSetting('obs-source-next', 'Keynote Presenter Notes');
    document.getElementById('obs-screenshot-width').value = getLocalSetting('obs-screenshot-width', '256');
    document.getElementById('obs-screenshot-freq').value = getLocalSetting('obs-screenshot-freq', '0.5');

    const prompterSize = getLocalSetting('prompter-font-size', '48');
    const prompterSizeEl = document.getElementById('prompter-font-size');
    if (prompterSizeEl) {
        prompterSizeEl.value = prompterSize;
        const sizeValEl = document.getElementById('prompter-font-size-val');
        if (sizeValEl) sizeValEl.innerText = prompterSize + 'px';
    }
    const prompterTextEl = document.getElementById('prompter-text');
    if (prompterTextEl) {
        prompterTextEl.style.fontSize = prompterSize + 'px';
    }

    const prompterSpeed = getLocalSetting('prompter-speed', '25');
    const prompterSpeedEl = document.getElementById('prompter-speed');
    if (prompterSpeedEl) {
        prompterSpeedEl.value = prompterSpeed;
        const speedValEl = document.getElementById('prompter-speed-val');
        if (speedValEl) speedValEl.innerText = prompterSpeed;
    }

    const prompterAuto = getLocalSetting('prompter-auto-scroll', 'true');
    const prompterAutoEl = document.getElementById('prompter-auto-scroll');
    if (prompterAutoEl) {
        prompterAutoEl.checked = (prompterAuto === 'true');
    }
}

async function loadObsCredentials() {
    // Check if the user has explicitly saved manual settings in localStorage
    const hasManualOverride = localStorage.getItem('keynote_studio_obs-ip') !== null;

    if (!hasManualOverride) {
        console.log("[OBS] No manual override found in localStorage. Fetching dynamic credentials from /api/obs/credentials...");
        try {
            const res = await fetch('/api/obs/credentials');
            if (res.ok) {
                const creds = await res.json();
                if (creds && creds.port) {
                    const ip = `127.0.0.1:${creds.port}`;
                    const password = creds.password || "";
                    document.getElementById('obs-ip').value = ip;
                    document.getElementById('obs-password').value = password;
                    console.log(`[OBS] Dynamically loaded credentials from api. IP: ${ip}, Password: ${password ? '********' : '(empty)'}`);
                }
            }
        } catch (e) {
            console.warn("[OBS] Failed to fetch dynamic credentials from /api/obs/credentials:", e);
        }
    } else {
        console.log("[OBS] Manual override found in localStorage. Skipping dynamic credential fetch.");
    }
}

// ==========================================================================
// Cables SSE Integration
// ==========================================================================
function connectCablesSSE() {
    const cablesStatus = document.getElementById('cables-status');
    cablesStatus.classList.remove('connected');

    console.log("[Cables] Connecting to SSE at /sse...");
    sseSource = new EventSource('/sse');

    sseSource.onopen = () => {
        cablesStatus.classList.add('connected');
        showToast('Connected to Cables Standalone server', 'success');
    };

    sseSource.onerror = (err) => {
        cablesStatus.classList.remove('connected');
        console.warn("[Cables] SSE connection closed. Reconnecting...");
    };

    sseSource.addEventListener('slides-update', (event) => {
        try {
            const parsed = JSON.parse(event.data);
            const data = parsed.data?.body || parsed.data || parsed;

            if (data.error) {
                showToast(`JXA Sync Error: ${data.error}`, 'error');
                return;
            }

            handleSlidesUpdate(data);
        } catch (e) {
            console.error("[SSE] Failed to parse slides update:", e);
        }
    });
}

async function triggerShortcut(name, input = null) {
    try {
        let inputObj = {};
        if (input !== null && typeof input === 'object') {
            inputObj = input;
        } else if (input !== null && input !== "") {
            inputObj = { "value": input };
        }

        const inputStr = JSON.stringify(inputObj);
        const response = await fetch(`/api/run-shortcut?name=${encodeURIComponent(name)}&input=${encodeURIComponent(inputStr)}`, {
            method: 'POST'
        });
        const result = await response.json();
        console.log(`[Cables] Triggered shortcut ${name}:`, result);
        return result;
    } catch (e) {
        console.error(`[Cables] Shortcut request error for ${name}:`, e);
        showToast(`Failed to run shortcut ${name}`, 'error');
    }
}

function syncKeynoteData() {
    showToast('Fetching presentation slides...', 'info');
    triggerShortcut('KnGetSlides');
}

// ==========================================================================
// Slides List Parsing & Tabulator Table
// ==========================================================================
function initTabulator() {
    slidesTable = new Tabulator("#slides-table", {
        data: [],
        layout: "fitColumns",
        selectableRows: 1,
        placeholder: "Syncing slides from Keynote...",
        columns: [
            { 
                title: "#", 
                field: "Index", 
                width: 60, 
                headerSort: false, 
                hozAlign: "center",
                cellClick: function(e, cell) {
                    const slideIndex = cell.getValue();
                    showToast(`Jumping to Slide ${slideIndex}...`, 'info');
                    triggerShortcut('KnGoToSlide', { "slideIndex": slideIndex });
                }
            },
            { title: "Slide Name", field: "Name", headerSort: false, editor: "input" },
            { title: "Section", field: "Section", headerSort: false, editor: "input" },
            { 
                title: "OBS Scene Mapping", 
                field: "Scene", 
                headerSort: false, 
                editor: "list",
                editorParams: {
                    values: obsScenes,
                    freetext: false,
                    allowEmpty: true,
                    listOnEmpty: true
                }
            },
            { title: "Notes", field: "Notes", visible: false }
        ]
    });

    // Row selection maps to edit panel
    slidesTable.on("rowSelected", (row) => {
        const data = row.getData();
        selectedSlideIndex = data.Index;

        const slideLabelEl = document.getElementById('editor-slide-label');
        if (slideLabelEl) {
            slideLabelEl.innerText = `Selected: Slide ${data.Index}`;
        }
        
        const selectEl = document.getElementById('editor-scene-input');
        if (selectEl) {
            const val = data.Scene || "";
            // Ensure the value exists as an option in the select, otherwise add it dynamically
            let optionExists = false;
            for (let i = 0; i < selectEl.options.length; i++) {
                if (selectEl.options[i].value === val) {
                    optionExists = true;
                    break;
                }
            }
            if (!optionExists && val !== "") {
                const opt = document.createElement('option');
                opt.value = val;
                opt.text = val;
                selectEl.appendChild(opt);
            }
            selectEl.value = val;
        }
        
        const notesPreviewEl = document.getElementById('editor-notes-preview');
        if (notesPreviewEl) {
            let notesText = data.Notes || "No notes on this slide.";
            if (notesText.includes("|||")) {
                notesText = notesText.split("|||").slice(1).join("|||").trim();
            }
            notesPreviewEl.innerText = notesText;
        }

        // Set active slide name in header
        const activeSlideNameEl = document.getElementById('active-slide-name');
        if (activeSlideNameEl) {
            activeSlideNameEl.innerText = `Slide ${data.Index}: ${data.Name || "No name"}`;
        }

        // Update Teleprompter notes
        let notesText = data.Notes || "No presenter notes.";
        if (notesText.includes("|||")) {
            notesText = notesText.split("|||").slice(1).join("|||").trim();
        }
        
        // Convert newlines to HTML line breaks for smooth iframe teleprompter rendering
        const formattedNotes = notesText.replace(/\n/g, '<br>');

        const prompterIframe = document.getElementById('prompter-iframe');
        if (prompterIframe && prompterIframe.contentWindow) {
            console.log("[Parent] Sending notes to teleprompter iframe...");
            prompterIframe.contentWindow.postMessage(JSON.stringify({
                method: 'getSlideNotes',
                result: formattedNotes
            }), '*');
        } else {
            const prompterTextEl = document.getElementById('prompter-text');
            if (prompterTextEl) {
                prompterTextEl.innerText = notesText;
            }
            
            // Trigger automatic prompter scroll if configured (legacy fallback)
            const prompterAutoScrollEl = document.getElementById('prompter-auto-scroll');
            if (prompterAutoScrollEl && prompterAutoScrollEl.checked) {
                resetPrompterScroll(true);
            }
        }

        // Orchestrate OBS Scene Change
        if (data.Scene) {
            syncOBSScene(data.Scene);
        }
    });

    // Enable double-click row to trigger transition in Keynote editor/play mode
    slidesTable.on("rowDblClick", (e, row) => {
        const data = row.getData();
        showToast(`Jumping to Slide ${data.Index}...`, 'info');
        triggerShortcut('KnGoToSlide', { "slideIndex": data.Index });
    });

    // Listen for inline table edits and save back
    slidesTable.on("cellEdited", (cell) => {
        const rowData = cell.getRow().getData();
        updateMetadataOnKeynote(rowData.Index, rowData.Scene, rowData.Id);
    });
}

function handleSlidesUpdate(payload) {
    const slides = payload.Slides || [];
    activeSlideIndex = payload.ActiveIndex || 1;

    // Assign missing UUIDs immediately in the client context
    slidesData = slides.map(slide => {
        if (!slide.Id) {
            slide.Id = self.crypto.randomUUID();
            console.log(`[Client] Assigned fresh UUID ${slide.Id} to Slide ${slide.Index}`);
        }
        return slide;
    });

    // Load data into Tabulator
    slidesTable.setData(slidesData).then(() => {
        // Redraw table focus onto currently active slide
        const rows = slidesTable.getRows();
        const activeRow = rows.find(r => r.getData().Index === activeSlideIndex);

        if (activeRow) {
            slidesTable.deselectRow();
            activeRow.select();
            activeRow.getElement().scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

function saveSlideSceneMapping() {
    if (selectedSlideIndex === null) {
        showToast('Please select a slide in the table first', 'error');
        return;
    }

    const row = slidesTable.getSelectedRows()[0];
    if (!row) return;

    const data = row.getData();
    const sceneInputEl = document.getElementById('editor-scene-input');
    if (!sceneInputEl) return;
    const sceneName = sceneInputEl.value.trim();

    showToast(`Saving scene mapping for Slide ${data.Index}...`, 'info');
    updateMetadataOnKeynote(data.Index, sceneName, data.Id);
}

async function updateMetadataOnKeynote(slideIndex, sceneName, uuid) {
    const payload = {
        slideNumber: slideIndex,
        sceneName: sceneName,
        uuid: uuid
    };

    // Run setSlideScene Shortcut
    const result = await triggerShortcut('KnSetSlideScene', payload);

    if (result && result.status === 'initiated') {
        showToast('Metadata update sent to Keynote!', 'success');
        // Refresh local slides index after a small delay to let JXA script complete its write
        setTimeout(() => {
            syncKeynoteData();
        }, 1500);
    }
}

async function captureCurrentOBSScene() {
    if (!obsConnected) {
        showToast('OBS is not connected!', 'error');
        return null;
    }
    try {
        const response = await obs.call('GetCurrentProgramScene');
        const sceneName = response.currentProgramSceneName;
        console.log("[OBS] Captured current program scene:", sceneName);
        return sceneName;
    } catch (e) {
        console.error("[OBS] Failed to get current program scene:", e);
        showToast('Failed to capture current OBS scene', 'error');
        return null;
    }
}

async function setSlideSceneFromOBS() {
    if (!obsConnected) {
        showToast('OBS WebSocket is not connected', 'error');
        return;
    }
    
    // Find the target row: use selection first, fallback to current active slide
    let targetRow = null;
    if (slidesTable) {
        targetRow = slidesTable.getSelectedRows()[0];
        if (!targetRow && activeSlideIndex !== null) {
            targetRow = slidesTable.getRows().find(r => r.getData().Index === activeSlideIndex);
        }
    }
    
    if (!targetRow) {
        showToast('Please select a slide in the table first', 'error');
        return;
    }
    
    const data = targetRow.getData();
    
    // Capture scene from OBS
    showToast('Capturing current OBS scene...', 'info');
    const sceneName = await captureCurrentOBSScene();
    if (!sceneName) return;
    
    showToast(`Setting Slide ${data.Index} scene to "${sceneName}"...`, 'info');
    
    // Update local table data first for instant visual feedback
    targetRow.update({ Scene: sceneName });
    
    // Trigger setSlideScene shortcut to update Keynote
    await updateMetadataOnKeynote(data.Index, sceneName, data.Id);
}

// ==========================================================================
// Keyboard Relative Navigation
// ==========================================================================
function handleKeyNavigation(e) {
    // Only capture keys if not typing in form inputs
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        if (!slidesTable) return;
        
        const selectedRows = slidesTable.getSelectedRows();
        if (selectedRows.length > 0) {
            const nextRow = selectedRows[0].getNextRow();
            if (nextRow) {
                slidesTable.deselectRow();
                nextRow.select();
                nextRow.getElement().scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                const data = nextRow.getData();
                showToast(`Navigating to Slide ${data.Index}...`, 'info');
                triggerShortcut('KnGoToSlide', { "slideIndex": data.Index });
            } else {
                showToast('Already at the last slide', 'warning');
            }
        } else {
            // If no row is selected, select the first one
            const firstRow = slidesTable.getRows()[0];
            if (firstRow) {
                firstRow.select();
                firstRow.getElement().scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                const data = firstRow.getData();
                triggerShortcut('KnGoToSlide', { "slideIndex": data.Index });
            }
        }
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (!slidesTable) return;
        
        const selectedRows = slidesTable.getSelectedRows();
        if (selectedRows.length > 0) {
            const prevRow = selectedRows[0].getPrevRow();
            if (prevRow) {
                slidesTable.deselectRow();
                prevRow.select();
                prevRow.getElement().scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                const data = prevRow.getData();
                showToast(`Navigating to Slide ${data.Index}...`, 'info');
                triggerShortcut('KnGoToSlide', { "slideIndex": data.Index });
            } else {
                showToast('Already at the first slide', 'warning');
            }
        } else {
            // If no row is selected, select the first one
            const firstRow = slidesTable.getRows()[0];
            if (firstRow) {
                firstRow.select();
                firstRow.getElement().scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                const data = firstRow.getData();
                triggerShortcut('KnGoToSlide', { "slideIndex": data.Index });
            }
        }
    }
}

// ==========================================================================
// OBS Scene Management
// ==========================================================================
async function fetchOBSScenes() {
    if (!obsConnected) return;
    try {
        console.log("[OBS] Fetching scene list...");
        const sceneList = await obs.call('GetSceneList');
        if (sceneList && sceneList.scenes) {
            const sceneNames = sceneList.scenes
                .map(s => (s.sceneName || s).trim())
                .filter(name => typeof name === 'string' && name.startsWith('Scene '));
            console.log(`[OBS] Successfully retrieved and filtered ${sceneNames.length} scenes:`, sceneNames);
            
            // Mutate in-place to preserve references
            obsScenes.length = 0;
            obsScenes.push(...sceneNames);
            
            // Populate sidebar select dropdown
            const selectEl = document.getElementById('editor-scene-input');
            if (selectEl) {
                let html = '<option value="">Select a scene...</option>';
                obsScenes.forEach(scene => {
                    html += `<option value="${scene}">${scene}</option>`;
                });
                selectEl.innerHTML = html;
            }

            // Explicitly force update column definition to be 100% bulletproof
            if (slidesTable) {
                slidesTable.updateColumnDefinition("Scene", {
                    editor: "list",
                    editorParams: {
                        values: obsScenes,
                        freetext: false,
                        allowEmpty: true,
                        listOnEmpty: true
                    }
                });
            }
        }
    } catch (err) {
        console.warn("[OBS] Failed to fetch scene list:", err);
    }
}

// ==========================================================================
// OBS WebSocket Connection & Screenshot Polling
// ==========================================================================
async function connectOBS() {
    const ip = document.getElementById('obs-ip').value;
    const password = document.getElementById('obs-password').value;
    const obsStatusBadge = document.getElementById('obs-status');
    const connectBtn = document.getElementById('btn-connect-obs');

    obsStatusBadge.classList.remove('connected');
    connectBtn.innerText = "Connecting to OBS...";

    try {
        await obs.connect(`ws://${ip}`, password);
        obsConnected = true;
        obsStatusBadge.classList.add('connected');
        connectBtn.innerText = "Disconnect OBS WebSocket";
        connectBtn.classList.add('btn-danger');
        showToast('Connected to OBS WebSocket', 'success');

        // Fetch scene list and update column dropdown
        await fetchOBSScenes();

        startOBSScreenshotPolling();
    } catch (err) {
        console.error("[OBS] Connection failed:", err);
        obsConnected = false;
        obsStatusBadge.classList.remove('connected');
        connectBtn.innerText = "Connect to OBS WebSocket";
        connectBtn.classList.remove('btn-danger');
        showToast('OBS WebSocket connection failed', 'error');
    }
}

function toggleOBSConnection() {
    if (obsConnected) {
        obs.disconnect();
        obsConnected = false;
        document.getElementById('obs-status').classList.remove('connected');
        const connectBtn = document.getElementById('btn-connect-obs');
        connectBtn.innerText = "Connect to OBS WebSocket";
        connectBtn.classList.remove('btn-danger');
        if (pollInterval) clearInterval(pollInterval);
        
        // Clear scenes on disconnect
        obsScenes = [];
        const selectEl = document.getElementById('editor-scene-input');
        if (selectEl) {
            selectEl.innerHTML = '<option value="">Select a scene...</option>';
        }
        
        showToast('Disconnected from OBS', 'info');
    } else {
        connectOBS();
    }
}

function applyCaptureSettings() {
    // Save settings values to LocalStorage
    saveLocalSetting('obs-ip', document.getElementById('obs-ip').value);
    saveLocalSetting('obs-password', document.getElementById('obs-password').value);
    saveLocalSetting('obs-source-current', document.getElementById('obs-source-current').value);
    saveLocalSetting('obs-source-next', document.getElementById('obs-source-next').value);
    saveLocalSetting('obs-screenshot-width', document.getElementById('obs-screenshot-width').value);
    saveLocalSetting('obs-screenshot-freq', document.getElementById('obs-screenshot-freq').value);

    showToast('Capture settings applied successfully', 'success');

    // Reschedule polling interval dynamically
    if (obsConnected) {
        startOBSScreenshotPolling();
    }
}

function startOBSScreenshotPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
    }

    const freq = parseFloat(document.getElementById('obs-screenshot-freq').value) || 0.5;
    const ms = freq * 1000;

    console.log(`[OBS] Starting screenshot polling loop at every ${ms}ms...`);
    pollInterval = setInterval(async () => {
        if (!obsConnected) return;

        const width = parseInt(document.getElementById('obs-screenshot-width').value) || 256;
        const currentSource = document.getElementById('obs-source-current').value.trim();
        const nextSource = document.getElementById('obs-source-next').value.trim();

        // Query Current Slide Preview Source Screenshot
        if (currentSource) {
            try {
                const response = await obs.call('GetSourceScreenshot', {
                    sourceName: currentSource,
                    imageFormat: 'jpeg',
                    imageWidth: width
                });

                const rawData = response?.imageData || response?.imageUri;
                if (rawData) {
                    const imgSrc = rawData.startsWith("data:") ? rawData : `data:image/jpeg;base64,${rawData}`;
                    const img = document.getElementById('current-slide-img');
                    const placeholder = document.getElementById('current-placeholder');
                    img.src = imgSrc;
                    img.style.display = 'block';
                    placeholder.style.display = 'none';
                    lastCurrentError = ""; // Reset error tracking on success
                }
            } catch (err) {
                if (err.message !== lastCurrentError) {
                    lastCurrentError = err.message;
                    console.warn(`[OBS] Failed current screenshot ("${currentSource}"):`, err.message || err);
                }
            }
        }

        // Query Next Slide Preview Source Screenshot
        if (nextSource) {
            try {
                const response = await obs.call('GetSourceScreenshot', {
                    sourceName: nextSource,
                    imageFormat: 'jpeg',
                    imageWidth: width
                });

                const rawData = response?.imageData || response?.imageUri;
                if (rawData) {
                    const imgSrc = rawData.startsWith("data:") ? rawData : `data:image/jpeg;base64,${rawData}`;
                    const img = document.getElementById('next-slide-img');
                    const placeholder = document.getElementById('next-placeholder');
                    img.src = imgSrc;
                    img.style.display = 'block';
                    placeholder.style.display = 'none';
                    lastNextError = ""; // Reset error tracking on success
                }
            } catch (err) {
                if (err.message !== lastNextError) {
                    lastNextError = err.message;
                    console.warn(`[OBS] Failed next screenshot ("${nextSource}"):`, err.message || err);
                }
            }
        }
    }, ms);
}

async function syncOBSScene(sceneName) {
    if (!obsConnected || !sceneName || sceneName === currentOBSScene) return;

    try {
        await obs.call('SetCurrentProgramScene', { sceneName: sceneName });
        currentOBSScene = sceneName;
        showToast(`OBS Scene set to: ${sceneName}`, 'success');
    } catch (e) {
        console.warn(`[OBS] Failed to change program scene to ${sceneName}:`, e);
    }
}

// ==========================================================================
// Teleprompter Auto-Scroll Engine
// ==========================================================================
function startPrompterScroll() {
    const container = document.getElementById('prompter-text-container');
    const speedInput = document.getElementById('prompter-speed');

    if (prompterScrollTimer) cancelAnimationFrame(prompterScrollTimer);

    let lastTime = performance.now();

    function scroll(now) {
        if (!isPrompterScrolling) return;
        const elapsed = now - lastTime;
        lastTime = now;

        const speed = parseFloat(speedInput.value) || 25;
        if (speed > 0) {
            const pixelsPerSecond = speed * 1.5;
            container.scrollTop += (pixelsPerSecond * elapsed) / 1000;
        }

        // Stop auto-scrolling if reached the bottom (all text has scrolled entirely above viewport)
        if (container.scrollTop >= container.scrollHeight - container.clientHeight - 1) {
            stopPrompterScroll();
            return;
        }

        prompterScrollTimer = requestAnimationFrame(scroll);
    }

    prompterScrollTimer = requestAnimationFrame(scroll);
}

function stopPrompterScroll() {
    isPrompterScrolling = false;
    if (prompterScrollTimer) cancelAnimationFrame(prompterScrollTimer);
    document.getElementById('btn-prompter-toggle').innerHTML = '▶️ Play';
}

function togglePrompterScroll() {
    if (isPrompterScrolling) {
        stopPrompterScroll();
    } else {
        isPrompterScrolling = true;
        document.getElementById('btn-prompter-toggle').innerHTML = '⏸️ Pause';
        startPrompterScroll();
    }
}

function resetPrompterScroll(autoStart = false) {
    const container = document.getElementById('prompter-text-container');
    container.scrollTop = 0;

    stopPrompterScroll();

    if (autoStart) {
        setTimeout(() => {
            isPrompterScrolling = true;
            document.getElementById('btn-prompter-toggle').innerHTML = '⏸️ Pause';
            startPrompterScroll();
        }, 500); // short delay to let notes be read comfortably
    }
}

// ==========================================================================
// Toast Notification Component
// ==========================================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = "ℹ️";
    if (type === 'success') icon = "✅";
    if (type === 'error') icon = "❌";

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}
