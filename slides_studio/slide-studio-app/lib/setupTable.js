/**
 * setupTable.js - Tabulator initialization for Slides Studio
 * Refactored as an ES Module for reliable dependency management.
 */

let tableInstance = null;
let isKeyPressed = false;

// Drag to Fill States & Handlers
let dragActive = false;
let startCell = null;
let startValue = null;
let draggedRows = [];

function startDragFill(cell) {
    dragActive = true;
    startCell = cell;
    startValue = cell.getValue();
    draggedRows = [cell.getRow()];
    
    document.body.classList.add('drag-fill-active');
    cell.getElement().classList.add('drag-fill-highlight');
}

function updateDragHighlight(targetCell) {
    if (!dragActive || !startCell) return;
    
    const activeRows = window.table.getRows("active");
    const startIndex = activeRows.indexOf(startCell.getRow());
    const targetIndex = activeRows.indexOf(targetCell.getRow());
    
    if (startIndex !== -1 && targetIndex !== -1) {
        const highlighted = document.querySelectorAll('.drag-fill-highlight');
        highlighted.forEach(el => el.classList.remove('drag-fill-highlight'));
        
        draggedRows = [];
        const minIndex = Math.min(startIndex, targetIndex);
        const maxIndex = Math.max(startIndex, targetIndex);
        
        for (let i = minIndex; i <= maxIndex; i++) {
            const row = activeRows[i];
            draggedRows.push(row);
            const sceneCell = row.getCell("scene");
            if (sceneCell) {
                sceneCell.getElement().classList.add('drag-fill-highlight');
            }
        }
    }
}

function endDragFill() {
    dragActive = false;
    document.body.classList.remove('drag-fill-active');
    
    const highlighted = document.querySelectorAll('.drag-fill-highlight');
    highlighted.forEach(el => el.classList.remove('drag-fill-highlight'));
    
    if (draggedRows.length > 0 && startCell) {
        const updatedRows = [];
        draggedRows.forEach(row => {
            const currentVal = row.getData().scene;
            if (currentVal !== startValue) {
                const sceneCell = row.getCell("scene");
                if (sceneCell) {
                    sceneCell.setValue(startValue);
                    updatedRows.push(row);
                }
            }
        });
        
        if (updatedRows.length > 0) {
            // Save updated table to LocalStorage
            if (window.slideDeckId && window.table) {
                localStorage.setItem(window.slideDeckId, JSON.stringify(window.table.getData()));
            }
            
            // Auto-save to sidecar file
            if (typeof window.saveToSidecar === 'function') {
                window.saveToSidecar();
            }
            
            // Batch-notify parent speakerview of updated mappings
            if (typeof window.sendMessageToParent === 'function') {
                updatedRows.forEach(row => {
                    const rData = row.getData();
                    const cleanRow = Object.fromEntries(
                        Object.entries(rData).filter(([key, value]) => {
                            if (key === 'cameraShape' && rData.hasOwnProperty(key)) return true;
                            return value != undefined && `${value}`.length > 0;
                        })
                    );
                    window.sendMessageToParent({
                        namespace: "studio",
                        message: "update-mapping",
                        data: cleanRow
                    });
                });
            }
        }
    }
    
    startCell = null;
    startValue = null;
    draggedRows = [];
}

// Global mouseup listener for drag fill completion
document.addEventListener('mouseup', () => {
    if (dragActive) {
        endDragFill();
    }
});

// Register keyboard listeners
document.addEventListener('keydown', function (event) {
    if (!window.table) return;

    if (event.key === ' ' && !isKeyPressed) {
        isKeyPressed = true;

        event.preventDefault(); // Prevents page scrolling

        const selectedRows = window.table.getSelectedRows();
        if (selectedRows.length > 0) {
            const nextRow = selectedRows[0].getNextRow();
            if (nextRow) {
                window.table.deselectRow();
                window.table.selectRow(nextRow);
                nextRow.scrollTo();
                if (typeof window.filterRowData === 'function') {
                    window.filterRowData(nextRow.getData());
                }
            }
        } else {
            // Select first row if none selected
            const firstRow = window.table.getRowFromPosition(1);
            if (firstRow) {
                window.table.selectRow(firstRow);
                if (typeof window.filterRowData === 'function') {
                    window.filterRowData(firstRow.getData());
                }
            }
        }
    }
});

document.addEventListener('keyup', function (event) {
    if (event.key === ' ') {
        isKeyPressed = false;
    }
});

/**
 * Initializes or refreshes the Tabulator table.
 * @param {Object} options Dropdown options for OBS metadata
 * @param {Array} data Optional slide data array
 */
export function loadTable(options = {}, data = null) {
    try {
        if (typeof Tabulator === 'undefined') {
            throw new Error("Tabulator library not found. Ensure tabulator.min.js is loaded correctly via <script>.");
        }
        options = options || {};
        const dropDowns = {
            scene: options.scene || [],
            slidePosition: options.slidePosition || [],
            cameraPosition: options.cameraPosition || [],
            cameraShape: options.cameraShape || []
        };

        const currentDeckId = window.slideDeckId;

        if (window.table && typeof window.table.destroy === 'function') {
            window.table.destroy();
            window.table = null;
        }

        let tableData = data;

        if (!tableData && currentDeckId) {
            try {
                const saved = localStorage.getItem(currentDeckId);
                if (saved) {
                    tableData = JSON.parse(saved);
                }
            } catch (e) { }
        }

        if (!tableData || tableData.length === 0) {
            tableData = window.slidesArray || [];
        }

        console.log("[SetupTable] Loading table with data:", tableData.length, "rows");

        const container = document.querySelector("#slidesTable");
        if (!container) {
            return;
        }

        window.table = new Tabulator("#slidesTable", {
            layout: "fitData",
            height: "500px",
            data: tableData,
            dataTree: true,
            dataTreeStartExpanded: true,
            dataTreeSort: true,
            selectableRange: true, // Enable full cell range selection
            selectableRangeClearCells: true,
            clipboard: true,
            clipboardCopyConfig: {
                columnHeaders: false,
                rowHeaders: false,
                groupHeaders: false,
            },
            clipboardCopyRowRange: "range",
            clipboardPasteParser: "range", // Parse pasted text as cell range
            clipboardPasteAction: "range", // Paste data directly into selected cell range
            initialSort: [
                { column: "slideState", dir: "asc" }
            ],
            columns: [
                {
                    title: "Index",
                    field: "slideState",
                    sorter: "alphanum",
                    cellClick: (e, cell) => {
                        if (typeof window.filterRowData === 'function') {
                            window.filterRowData(cell.getRow().getData());
                        }
                    }
                },
                {
                    title: "Scene",
                    field: "scene",
                    editor: "list",
                    editorParams: { values: dropDowns.scene },
                    formatter: function(cell, formatterParams, onRendered) {
                        const val = cell.getValue() || "";
                        onRendered(() => {
                            const cellEl = cell.getElement();
                            cellEl.style.position = "relative";
                            if (!cellEl.querySelector('.drag-fill-handle')) {
                                const handle = document.createElement('div');
                                handle.className = 'drag-fill-handle';
                                cellEl.appendChild(handle);
                                
                                handle.addEventListener('mousedown', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    startDragFill(cell);
                                });
                            }
                        });
                        return val;
                    },
                    cellEdited: (cell) => {
                        broadcastChange(cell);
                        saveTableToLocalStorage();
                    }
                },
            ],
        });

        // Track mouse hover over Scene cells during drag-to-fill
        window.table.on("cellMouseEnter", (e, cell) => {
            if (dragActive && cell.getColumn().getField() === "scene") {
                updateDragHighlight(cell);
            }
        });

        window.table.on("clipboardPasted", (clipboardData, rowData, rows) => {
            console.log("[SetupTable] Clipboard pasted. Modified rows count:", rows ? rows.length : 0);
            
            // Save updated table to LocalStorage
            saveTableToLocalStorage();
            
            // Auto-save to sidecar file
            if (typeof window.saveToSidecar === 'function') {
                window.saveToSidecar();
            }
            
            // Batch-notify parent speakerview of updated mappings to persist in OBS _Slide_Scene_Map
            if (rows && rows.length > 0 && typeof window.sendMessageToParent === 'function') {
                rows.forEach(row => {
                    const rData = row.getData();
                    const cleanRow = Object.fromEntries(
                        Object.entries(rData).filter(([key, value]) => {
                            if (key === 'cameraShape' && rData.hasOwnProperty(key)) return true;
                            return value != undefined && `${value}`.length > 0;
                        })
                    );
                    window.sendMessageToParent({
                        namespace: "studio",
                        message: "update-mapping",
                        data: cleanRow
                    });
                });
            }
        });

        window.table.on("tableBuilt", () => {
            window.isTableBuilt = true;
            console.log("[SetupTable] Table initialized and built.");
            if (typeof window.onTableBuilt === 'function') {
                window.onTableBuilt();
            }
        });


        function broadcastChange(cell) {
            if (typeof window.filterRowData === 'function') {
                window.filterRowData(cell.getRow().getData());
            }
        }

        function saveTableToLocalStorage() {
            if (window.slideDeckId && window.table) {
                localStorage.setItem(window.slideDeckId, JSON.stringify(window.table.getData()));
            }
        }

        window.table.on("rowClick", (e, row) => {
            window.table.deselectRow();
            row.select();
            if (typeof window.filterRowData === 'function') {
                window.filterRowData(row.getData());
            }
        });

    } catch (err) {
        console.error("[SetupTable] CRITICAL FAILURE:", err);
    }
}

// Ensure it's available globally for any non-module triggers
window.loadTable = loadTable;
