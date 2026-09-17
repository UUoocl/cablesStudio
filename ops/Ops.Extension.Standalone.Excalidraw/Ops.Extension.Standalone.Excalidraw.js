const http = (typeof op.require === "function") ? op.require("http") : ((typeof require !== "undefined") ? require("http") : null);
const fs = (typeof op.require === "function") ? op.require("fs") : ((typeof require !== "undefined") ? require("fs") : null);
const path = (typeof op.require === "function") ? op.require("path") : ((typeof require !== "undefined") ? require("path") : null);

const
    exec = op.inTrigger("Trigger"),
    inReqData = op.inObject("Request Data"),
    inResponse = op.inObject("Response"),
    inRoute = op.inString("API Route", "/api/excalidraw"),

    inTheme = op.inValueSelect("Theme", ["dark", "light"], "dark"),
    inTransparent = op.inBool("Transparent", false),
    inShowUi = op.inBool("Show UI", true),
    inReadOnly = op.inBool("Read Only", false),
    inGridMode = op.inBool("Grid Mode", false),
    inZenMode = op.inBool("Zen Mode", false),
    inAutoSave = op.inBool("Auto Save", true),
    inTitle = op.inString("App Title", "Excalidraw Standalone"),
    inSceneData = op.inObject("Initial Scene Data"),
    inSceneJsonStr = op.inString("Initial Scene JSON String", ""),
    inReloadPreview = op.inTriggerButton("Reload Preview"),

    outSuccess = op.outTrigger("On Request"),
    outSceneUpdated = op.outTrigger("On Scene Updated"),
    outErrorTrigger = op.outTrigger("On Error"),
    outElement = op.outObject("Element"),
    outHtml = op.outString("HTML"),
    outSceneData = op.outObject("Scene Data"),
    outSceneJson = op.outString("Scene JSON String"),
    outError = op.outString("Error");

outElement.ignoreValueSerialize = true;
outHtml.ignoreValueSerialize = true;

op.setPortGroup("HTTP Server Integration", [exec, inReqData, inResponse, inRoute]);
op.setPortGroup("Excalidraw Settings", [inTheme, inTransparent, inShowUi, inReadOnly, inGridMode, inZenMode, inAutoSave, inTitle]);
op.setPortGroup("Scene Data", [inSceneData, inSceneJsonStr]);

let iframeElement = null;
let currentScene = { "elements": [], "appState": {}, "files": {} };

exec.onTriggered = handleHttpRequest;
inReloadPreview.onTriggered = refreshPreview;

inTheme.onChange = refreshPreview;
inTransparent.onChange = refreshPreview;
inShowUi.onChange = refreshPreview;
inReadOnly.onChange = refreshPreview;
inGridMode.onChange = refreshPreview;
inZenMode.onChange = refreshPreview;
inTitle.onChange = refreshPreview;

inSceneData.onChange = () =>
{
    const d = inSceneData.get();
    if (d && typeof d === "object")
    {
        currentScene = d;
        outSceneData.set(currentScene);
        outSceneJson.set(JSON.stringify(currentScene));
        refreshPreview();
    }
};

inSceneJsonStr.onChange = () =>
{
    const str = inSceneJsonStr.get();
    if (str)
    {
        try
        {
            const parsed = JSON.parse(str);
            if (parsed && typeof parsed === "object")
            {
                currentScene = parsed;
                outSceneData.set(currentScene);
                outSceneJson.set(JSON.stringify(currentScene));
                refreshPreview();
            }
        }
        catch (e)
        {
            op.logWarn("[Excalidraw] Failed to parse Initial Scene JSON String:", e.message);
        }
    }
};

op.onDelete = () =>
{
    if (iframeElement && iframeElement.parentNode)
    {
        iframeElement.parentNode.removeChild(iframeElement);
        iframeElement = null;
    }
};

function normalizeRoute(route)
{
    let r = (route || "/api/excalidraw").trim();
    if (!r.startsWith("/")) r = "/" + r;
    if (r.length > 1 && r.endsWith("/")) r = r.slice(0, -1);
    return r;
}

function getEffectiveScene()
{
    let scene = null;
    if (currentScene && (currentScene.elements || currentScene.appState))
    {
        scene = JSON.parse(JSON.stringify(currentScene));
    }
    else
    {
        scene = {
            "elements": [],
            "appState": { "theme": inTheme.get() || "dark", "gridSize": inGridMode.get() ? 20 : null },
            "files": {}
        };
    }

    if (inTransparent.get())
    {
        scene.appState = scene.appState || {};
        scene.appState.viewBackgroundColor = "transparent";
    }

    return scene;
}

function handleHttpRequest()
{
    const reqData = inReqData.get();
    const res = inResponse.get();

    op.log("[Excalidraw] HTTP Request trigger fired!");

    if (!reqData)
    {
        op.logWarn("[Excalidraw] Trigger received but 'Request Data' input is empty. Is it wired to HttpFileServer?");
        return;
    }

    const configuredRoute = normalizeRoute(inRoute.get());
    const reqPathname = normalizeRoute(reqData.pathname || "");
    const altRoute = configuredRoute.startsWith("/api/") ? configuredRoute.replace(/^\/api/, "") : "/api" + configuredRoute;

    const matchesConfigured = reqPathname === configuredRoute || reqPathname.startsWith(configuredRoute + "/");
    const matchesAlt = reqPathname === altRoute || reqPathname.startsWith(altRoute + "/");

    op.log("[Excalidraw] Configured route:", configuredRoute, "Requested:", reqPathname);

    if (!matchesConfigured && !matchesAlt)
    {
        op.log("[Excalidraw] Path", reqPathname, "does not match configured route", configuredRoute);
        return;
    }

    const matchedRoute = matchesConfigured ? configuredRoute : altRoute;

    // Flag response as handled
    if (res)
    {
        res._handled = true;
        res._cablesHandled = true;
    }
    else
    {
        op.logWarn("[Excalidraw] Warning: 'Response' input port is empty!");
    }

    // Handle OPTIONS preflight
    if (reqData.method === "OPTIONS")
    {
        if (res && !res.headersSent)
        {
            res.statusCode = 204;
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
            res.end();
        }
        return;
    }

    // Handle POST/PUT scene updates (/api/excalidraw/scene, /excalidraw/scene, or /api/excalidraw)
    if (reqData.method === "POST" || reqData.method === "PUT")
    {
        let bodyData = reqData.body;
        if (typeof bodyData === "string")
        {
            try { bodyData = JSON.parse(bodyData); } catch (e) {}
        }

        if (bodyData && typeof bodyData === "object")
        {
            const newScene = bodyData.scene || bodyData;
            if (newScene.elements || newScene.appState)
            {
                currentScene = newScene;
                outSceneData.set(currentScene);
                outSceneJson.set(JSON.stringify(currentScene));
                outSceneUpdated.trigger();

                if (res && !res.headersSent)
                {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.setHeader("Access-Control-Allow-Origin", "*");
                    res.end(JSON.stringify({ "status": "success", "message": "Scene updated" }));
                }
                outError.set("");
                outSuccess.trigger();
                return;
            }
        }
    }

    // Handle GET scene JSON subroute (/api/excalidraw/scene or /excalidraw/scene)
    if (reqPathname === configuredRoute + "/scene" || reqPathname === altRoute + "/scene")
    {
        if (res && !res.headersSent)
        {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(JSON.stringify(getEffectiveScene()));
        }
        outError.set("");
        outSuccess.trigger();
        return;
    }

    // Default: Serve full HTML Excalidraw Application
    const htmlContent = generateExcalidrawHtml(matchedRoute);
    outHtml.set(htmlContent);
    updateElement(htmlContent);

    if (res && !res.headersSent)
    {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end(htmlContent);
    }

    outError.set("");
    outSuccess.trigger();
}

function refreshPreview()
{
    const html = generateExcalidrawHtml();
    outHtml.set(html);
    updateElement(html);
}

function updateElement(html)
{
    if (typeof document === "undefined") return;

    if (!iframeElement)
    {
        iframeElement = document.createElement("iframe");
        iframeElement.id = "cables_excalidraw_" + op.id;
        iframeElement.style.border = "none";
        iframeElement.style.background = "transparent";
        iframeElement.style.width = "100%";
        iframeElement.style.height = "100%";
        iframeElement.setAttribute("allowtransparency", "true");
    }

    if (html)
    {
        iframeElement.srcdoc = html;
    }

    outElement.set(iframeElement);
}

function escapeHtml(str)
{
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function generateExcalidrawHtml(overrideRoute)
{
    const theme = inTheme.get() || "dark";
    const transparent = inTransparent.get();
    const showUi = inShowUi.get();
    const readOnly = inReadOnly.get();
    const gridMode = inGridMode.get();
    const zenMode = inZenMode.get();
    const autoSave = inAutoSave.get();
    const title = inTitle.get() || "Excalidraw Standalone";
    const scene = getEffectiveScene();
    const route = overrideRoute || normalizeRoute(inRoute.get());

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    html, body, #root {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background-color: ${transparent ? "transparent" : (theme === "dark" ? "#121212" : "#ffffff")};
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    ${transparent ? `
    html, body, #root, .excalidraw, .excalidraw-container, .excalidraw .App-main, .excalidraw-wrapper {
      background: transparent !important;
      background-color: transparent !important;
    }
    .excalidraw canvas {
      background: transparent !important;
    }
    ` : ""}
    ${!showUi ? `
    .layer-ui__wrapper, .App-menu, .App-toolbar, .App-bottom-bar, .App-top-bar, .utility-toolbar, .footer-center, .dropdown-menu, .sidebar-trigger, .island, .main-menu-trigger, .zen-mode-button, .excalidraw button {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    ` : ""}
    html.hide-excalidraw-ui .layer-ui__wrapper,
    html.hide-excalidraw-ui .App-menu,
    html.hide-excalidraw-ui .App-toolbar,
    html.hide-excalidraw-ui .App-bottom-bar,
    html.hide-excalidraw-ui .App-top-bar,
    html.hide-excalidraw-ui .utility-toolbar,
    html.hide-excalidraw-ui .footer-center,
    html.hide-excalidraw-ui .dropdown-menu,
    html.hide-excalidraw-ui .sidebar-trigger,
    html.hide-excalidraw-ui .island,
    html.hide-excalidraw-ui .main-menu-trigger,
    html.hide-excalidraw-ui .zen-mode-button,
    html.hide-excalidraw-ui .excalidraw button {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: ${theme === "dark" ? "#e0e0e0" : "#333333"};
      gap: 16px;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"};
      border-left-color: #6965db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>

  <!-- React & ReactDOM -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>

  <!-- Excalidraw bundle -->
  <script src="https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw.production.min.js" crossorigin></script>
</head>
<body>
  <div id="root">
    <div class="loading-container">
      <div class="spinner"></div>
      <div>Loading Excalidraw Client...</div>
    </div>
  </div>

  <script>
    (function() {
      const initialScene = ${JSON.stringify(scene)};
      const urlParams = new URLSearchParams(window.location.search);
      const uiParam = urlParams.get("ui") || urlParams.get("showUi") || urlParams.get("showUI");
      const hideUiParam = urlParams.get("hideUi") || urlParams.get("hideUI");
      let activeShowUi = ${showUi};

      if (uiParam !== null) {
        activeShowUi = uiParam === "true" || uiParam === "1";
      } else if (hideUiParam !== null) {
        activeShowUi = hideUiParam !== "true" && hideUiParam !== "1";
      }

      if (!activeShowUi) {
        document.documentElement.classList.add("hide-excalidraw-ui");
      }

      const config = {
        theme: "${theme}",
        showUi: activeShowUi,
        readOnly: ${readOnly},
        gridMode: ${gridMode},
        zenMode: ${zenMode},
        autoSave: ${autoSave},
        apiRoute: "${route}"
      };

      let saveTimeout = null;

      function saveScene(elements, appState, files) {
        if (!config.autoSave || config.readOnly) return;

        const cleanState = {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
          theme: appState.theme
        };

        const payload = {
          elements: elements,
          appState: cleanState,
          files: files || {}
        };

        fetch(config.apiRoute + "/scene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(err => console.warn("[Excalidraw Client] Auto-save failed:", err));
      }

      function debouncedSave(elements, appState, files) {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveScene(elements, appState, files), 1000);
      }

      function ExcalidrawApp() {
        const onChange = React.useCallback((elements, state, files) => {
          debouncedSave(elements, state, files);
        }, []);

        return React.createElement(
          'div',
          { style: { width: '100vw', height: '100vh' } },
          React.createElement(ExcalidrawLib.Excalidraw, {
            theme: config.theme,
            initialData: initialScene,
            viewModeEnabled: config.readOnly,
            gridModeEnabled: config.gridMode,
            zenModeEnabled: config.zenMode,
            onChange: onChange
          })
        );
      }

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(ExcalidrawApp));
    })();
  </script>
</body>
</html>`;
}

