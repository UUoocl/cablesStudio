const http = (typeof op.require === "function") ? op.require("http") : ((typeof require !== "undefined") ? require("http") : null);
const https = (typeof op.require === "function") ? op.require("https") : ((typeof require !== "undefined") ? require("https") : null);
const fs = (typeof op.require === "function") ? op.require("fs") : ((typeof require !== "undefined") ? require("fs") : null);
const path = (typeof op.require === "function") ? op.require("path") : ((typeof require !== "undefined") ? require("path") : null);
const url = (typeof op.require === "function") ? op.require("url") : ((typeof require !== "undefined") ? require("url") : null);

const
    exec = op.inTrigger("Trigger"),
    inReqData = op.inObject("Request Data"),
    inResponse = op.inObject("Response"),
    inRoute = op.inString("API Route", "/api/slides"),
    inTargetBg = op.inString("Target Background Color", "#abcdef"),
    inHideNavbar = op.inBool("Hide Viewer Navbar", false),
    inDirectUrl = op.inString("Fetch URL Direct", ""),
    inDirectTrigger = op.inTriggerButton("Trigger Direct Fetch"),

    outSuccess = op.outTrigger("On Success"),
    outErrorTrigger = op.outTrigger("On Error"),
    outElement = op.outObject("Element"),
    outHtml = op.outString("Transformed HTML"),
    outLastUrl = op.outString("Last Slide URL"),
    outError = op.outString("Error");

outElement.ignoreValueSerialize = true;
outHtml.ignoreValueSerialize = true;

let iframeElement = null;

function updateElement(html)
{
    if (typeof document === "undefined") return;

    if (!iframeElement)
    {
        iframeElement = document.createElement("iframe");
        iframeElement.id = "cables_slides_" + op.id;
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

op.onDelete = () =>
{
    if (iframeElement && iframeElement.parentNode)
    {
        iframeElement.parentNode.removeChild(iframeElement);
        iframeElement = null;
    }
};

op.log("[GoogleSlidesResponse] Script loaded and initialized!");

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

exec.onTriggered = handleHttpRequest;
inDirectTrigger.onTriggered = handleDirectFetch;

inReqData.onChange = () =>
{
    const d = inReqData.get();
    op.log("[GoogleSlidesResponse] 'Request Data' port updated. Pathname:", d ? d.pathname : "null");
};

inResponse.onChange = () =>
{
    op.log("[GoogleSlidesResponse] 'Response' port updated. Has ServerResponse:", !!inResponse.get());
};

inRoute.onChange = () =>
{
    op.log("[GoogleSlidesResponse] 'API Route' port changed to:", inRoute.get());
};

function hexToRgb(hex)
{
    hex = (hex || "").replace(/^#/, "").trim();
    if (hex.length === 3)
    {
        hex = hex.split("").map((c) => c + c).join("");
    }
    if (hex.length !== 6) return null;
    const num = parseInt(hex, 16);
    return {
        "r": (num >> 16) & 255,
        "g": (num >> 8) & 255,
        "b": num & 255
    };
}

function normalizeRoute(route)
{
    let r = (route || "/api/slides").trim();
    if (!r.startsWith("/")) r = "/" + r;
    if (r.length > 1 && r.endsWith("/")) r = r.slice(0, -1);
    return r;
}

const slideCache = new Map();
const CACHE_TTL_MS = 60000; // 1-minute in-memory cache

function handleHttpRequest()
{
    const reqData = inReqData.get();
    const res = inResponse.get();

    op.log("[GoogleSlidesResponse] Trigger fired!");
    op.log("[GoogleSlidesResponse] - Request Data present:", !!reqData, reqData ? reqData.pathname : "none");
    op.log("[GoogleSlidesResponse] - Response Object present:", !!res);

    if (!reqData)
    {
        op.logWarn("[GoogleSlidesResponse] Trigger received but 'Request Data' input is empty. Is it wired to HttpFileServer?");
        return;
    }

    const configuredRoute = normalizeRoute(inRoute.get());
    const reqPathname = normalizeRoute(reqData.pathname || "");

    op.log("[GoogleSlidesResponse] - Configured route:", configuredRoute, "vs Requested:", reqPathname);

    // Only process requests that target our configured API Route or its subroutes (/image, /proxy)
    if (reqPathname !== configuredRoute && !reqPathname.startsWith(configuredRoute + "/"))
    {
        op.log("[GoogleSlidesResponse] Ignoring request: path", reqPathname, "does not match configured route", configuredRoute);
        return;
    }

    // Flag response as handled by this operator so upstream timeout doesn't fire
    if (res)
    {
        res._handled = true;
        res._cablesHandled = true;
        op.log("[GoogleSlidesResponse] Set res._handled = true on ServerResponse object.");
    }
    else
    {
        op.logWarn("[GoogleSlidesResponse] Warning: 'Response' input port is empty! Cannot write HTTP response headers.");
    }

    // Handle Image Proxy Subroute
    if (reqPathname === configuredRoute + "/image" || reqPathname === configuredRoute + "/proxy" || reqPathname.startsWith(configuredRoute + "/image/"))
    {
        let imgTargetUrl = "";
        if (reqData.query && typeof reqData.query === "object")
        {
            imgTargetUrl = reqData.query.url || reqData.query.u || reqData.query.imgUrl || "";
        }
        if (!imgTargetUrl && reqData.body && typeof reqData.body === "object")
        {
            imgTargetUrl = reqData.body.url || reqData.body.u || reqData.body.imgUrl || "";
        }

        if (!imgTargetUrl)
        {
            if (res && !res.headersSent)
            {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.end(JSON.stringify({ "error": "Missing 'url' query parameter for image proxy." }));
            }
            return;
        }

        handleImageProxy(imgTargetUrl, res);
        return;
    }

    op.log("[GoogleSlidesResponse] Handling HTML request for route:", reqPathname);

    let targetUrl = "";
    let customBg = inTargetBg.get() || "#abcdef";
    let hideNavbar = inHideNavbar.get();
    let bypassCache = false;

    if (reqData.query && typeof reqData.query === "object")
    {
        targetUrl = reqData.query.url || reqData.query.slidesUrl || reqData.query.slideUrl || "";
        if (reqData.query.bg) customBg = reqData.query.bg;
        if (reqData.query.hideNavbar !== undefined)
        {
            hideNavbar = reqData.query.hideNavbar === "true" || reqData.query.hideNavbar === "1";
        }
        if (reqData.query.nocache === "1" || reqData.query.refresh === "1" || reqData.query.nocache === "true")
        {
            bypassCache = true;
        }
    }

    if (!targetUrl && reqData.body && typeof reqData.body === "object")
    {
        targetUrl = reqData.body.url || reqData.body.slidesUrl || reqData.body.slideUrl || "";
        if (reqData.body.bg) customBg = reqData.body.bg;
        if (reqData.body.hideNavbar !== undefined)
        {
            hideNavbar = reqData.body.hideNavbar === true || reqData.body.hideNavbar === "true" || reqData.body.hideNavbar === 1 || reqData.body.hideNavbar === "1";
        }
        if (reqData.body.nocache || reqData.body.refresh)
        {
            bypassCache = true;
        }
    }

    if (!targetUrl)
    {
        const errStr = "Missing 'url' query parameter. Example: " + configuredRoute + "?url=https://docs.google.com/presentation/d/.../pub...";
        op.logWarn("[GoogleSlidesResponse]", errStr);
        outError.set(errStr);
        outErrorTrigger.trigger();

        if (res && !res.headersSent)
        {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(JSON.stringify({ "error": errStr, "route": reqPathname }));
        }
        return;
    }

    // Check cache
    const cacheKey = `${targetUrl}::${customBg}::${hideNavbar}`;
    const now = Date.now();
    if (!bypassCache && slideCache.has(cacheKey))
    {
        const cached = slideCache.get(cacheKey);
        if (now - cached.timestamp < CACHE_TTL_MS)
        {
            op.log("[GoogleSlidesResponse] Serving from cache for URL:", targetUrl);
            outLastUrl.set(targetUrl);
            outHtml.set(cached.html);
            updateElement(cached.html);
            outError.set("");
            outSuccess.trigger();

            if (res && !res.headersSent)
            {
                res.statusCode = 200;
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Range");
                res.end(cached.html);
            }
            return;
        }
    }

    fetchAndTransformSlides(targetUrl, customBg, hideNavbar, (err, transformedHtml) =>
    {
        if (err)
        {
            const msg = "Failed to load Google Slides: " + (err.message || String(err));
            op.logError("[GoogleSlidesResponse]", msg);
            outError.set(msg);
            outErrorTrigger.trigger();

            if (res && !res.headersSent)
            {
                res.statusCode = 502;
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.end(JSON.stringify({ "error": msg, "targetUrl": targetUrl }));
            }
            return;
        }

        // Store in cache
        slideCache.set(cacheKey, {
            "html": transformedHtml,
            "timestamp": Date.now()
        });

        outLastUrl.set(targetUrl);
        outHtml.set(transformedHtml);
        updateElement(transformedHtml);
        outError.set("");
        outSuccess.trigger();

        if (res && !res.headersSent)
        {
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Range");
            res.end(transformedHtml);
            op.log("[GoogleSlidesResponse] Successfully served transparent Google Slides HTML of length:", transformedHtml.length);
        }
    });
}

function handleDirectFetch()
{
    const targetUrl = (inDirectUrl.get() || "").trim();
    const customBg = inTargetBg.get() || "#abcdef";
    const hideNavbar = inHideNavbar.get();

    if (!targetUrl)
    {
        const msg = "Direct Fetch URL is empty.";
        outError.set(msg);
        outErrorTrigger.trigger();
        return;
    }

    op.log("[GoogleSlidesResponse] Performing direct fetch for URL:", targetUrl);

    fetchAndTransformSlides(targetUrl, customBg, hideNavbar, (err, transformedHtml) =>
    {
        if (err)
        {
            const msg = "Direct Fetch failed: " + (err.message || String(err));
            outError.set(msg);
            outErrorTrigger.trigger();
            return;
        }

        outLastUrl.set(targetUrl);
        outHtml.set(transformedHtml);
        updateElement(transformedHtml);
        outError.set("");
        outSuccess.trigger();
    });
}

function fetchAndTransformSlides(targetUrl, customBg, hideNavbar, callback)
{
    const configuredRoute = normalizeRoute(inRoute.get());
    fetchRawContent(targetUrl, (err, rawHtml) =>
    {
        if (err) return callback(err);
        try
        {
            const isRemote = targetUrl.startsWith("http://") || targetUrl.startsWith("https://");
            const transformed = transformGoogleSlidesHtml(rawHtml, customBg, hideNavbar, isRemote, configuredRoute);
            callback(null, transformed);
        }
        catch (transErr)
        {
            callback(transErr);
        }
    });
}

const imgCache = new Map();
const IMG_CACHE_TTL = 300000; // 5-minute image cache

function handleImageProxy(imgTargetUrl, res)
{
    if (!imgTargetUrl) return;

    if (!imgTargetUrl.startsWith("http://") && !imgTargetUrl.startsWith("https://"))
    {
        if (imgTargetUrl.startsWith("//"))
        {
            imgTargetUrl = "https:" + imgTargetUrl;
        }
        else if (imgTargetUrl.startsWith("/"))
        {
            imgTargetUrl = "https://docs.google.com" + imgTargetUrl;
        }
        else
        {
            imgTargetUrl = "https://docs.google.com/" + imgTargetUrl;
        }
    }

    const now = Date.now();
    if (imgCache.has(imgTargetUrl))
    {
        const cached = imgCache.get(imgTargetUrl);
        if (now - cached.timestamp < IMG_CACHE_TTL)
        {
            if (res && !res.headersSent)
            {
                res.statusCode = 200;
                res.setHeader("Content-Type", cached.contentType || "image/jpeg");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
                res.setHeader("Cache-Control", "public, max-age=86400");
                res.end(cached.buffer);
            }
            return;
        }
    }

    fetchRemoteBinary(imgTargetUrl, 0, (err, buffer, contentType) =>
    {
        if (err)
        {
            op.logWarn("[GoogleSlidesResponse] Image proxy error for URL:", imgTargetUrl, err.message);
            if (res && !res.headersSent)
            {
                res.statusCode = 502;
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.end(JSON.stringify({ "error": "Image proxy fetch failed", "message": err.message }));
            }
            return;
        }

        imgCache.set(imgTargetUrl, {
            "buffer": buffer,
            "contentType": contentType,
            "timestamp": Date.now()
        });

        if (res && !res.headersSent)
        {
            res.statusCode = 200;
            res.setHeader("Content-Type", contentType || "image/jpeg");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
            res.setHeader("Cache-Control", "public, max-age=86400");
            res.end(buffer);
        }
    });
}

function fetchRemoteBinary(remoteUrl, redirectCount, callback)
{
    if (redirectCount > 5)
    {
        return callback(new Error("Too many redirects"));
    }

    let parsed;
    try
    {
        parsed = new URL(remoteUrl);
    }
    catch (e)
    {
        return callback(new Error("Invalid image URL: " + remoteUrl));
    }

    const client = parsed.protocol === "https:" ? https : http;
    if (!client)
    {
        return callback(new Error("HTTP/HTTPS client not available"));
    }

    const options = {
        "hostname": parsed.hostname,
        "port": parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        "path": parsed.pathname + parsed.search,
        "method": "GET",
        "headers": {
            "User-Agent": USER_AGENT,
            "Referer": "https://docs.google.com/",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
    };

    const req = client.request(options, (res) =>
    {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        {
            let redirectUrl = res.headers.location;
            if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://"))
            {
                redirectUrl = new URL(redirectUrl, remoteUrl).href;
            }
            res.resume();
            return fetchRemoteBinary(redirectUrl, redirectCount + 1, callback);
        }

        if (res.statusCode !== 200)
        {
            res.resume();
            return callback(new Error("Image fetch failed: " + res.statusCode));
        }

        const chunks = [];
        res.on("data", (chunk) => { chunks.push(chunk); });
        res.on("end", () =>
        {
            const buffer = Buffer.concat(chunks);
            const contentType = res.headers["content-type"] || "image/jpeg";
            callback(null, buffer, contentType);
        });
    });

    req.on("error", callback);
    req.setTimeout(15000, () =>
    {
        req.destroy(new Error("Image request timed out"));
    });
    req.end();
}

function fetchRawContent(targetUrl, callback)
{
    if (!targetUrl) return callback(new Error("No URL or file path provided"));

    // Check if it's a local file URL or local file path
    if (targetUrl.startsWith("file://") || !targetUrl.match(/^https?:\/\//i))
    {
        if (!fs || !path) return callback(new Error("File system module not available"));

        let filePath = targetUrl;
        if (filePath.startsWith("file://"))
        {
            filePath = filePath.replace(/^file:\/\//, "");
        }

        if (!path.isAbsolute(filePath))
        {
            const basePath = (op.patch.config && op.patch.config.paths && op.patch.config.paths.patchPath) || (typeof process !== "undefined" && process.cwd ? process.cwd() : "");
            filePath = path.resolve(basePath, filePath);
        }

        fs.readFile(filePath, "utf8", (err, data) =>
        {
            if (err) return callback(new Error("Local file not found: " + filePath + " (" + err.message + ")"));
            callback(null, data);
        });
        return;
    }

    // Remote HTTP/HTTPS fetch with redirect support
    fetchRemoteUrl(targetUrl, 0, callback);
}

function fetchRemoteUrl(remoteUrl, redirectCount, callback)
{
    if (redirectCount > 5)
    {
        return callback(new Error("Too many redirects while fetching URL: " + remoteUrl));
    }

    let parsed;
    try
    {
        parsed = new URL(remoteUrl);
    }
    catch (e)
    {
        return callback(new Error("Invalid URL format: " + remoteUrl));
    }

    const client = parsed.protocol === "https:" ? https : http;
    if (!client)
    {
        return callback(new Error("HTTP/HTTPS client not available"));
    }

    const options = {
        "hostname": parsed.hostname,
        "port": parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        "path": parsed.pathname + parsed.search,
        "method": "GET",
        "headers": {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
        }
    };

    const req = client.request(options, (res) =>
    {
        // Handle HTTP redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        {
            let redirectUrl = res.headers.location;
            if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://"))
            {
                redirectUrl = new URL(redirectUrl, remoteUrl).href;
            }
            res.resume(); // Consume response data to free memory
            return fetchRemoteUrl(redirectUrl, redirectCount + 1, callback);
        }

        if (res.statusCode !== 200)
        {
            res.resume();
            return callback(new Error("HTTP request failed with status: " + res.statusCode + " " + res.statusMessage));
        }

        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () =>
        {
            callback(null, body);
        });
    });

    req.on("error", (err) =>
    {
        callback(err);
    });

    req.setTimeout(15000, () =>
    {
        req.destroy(new Error("HTTP request timed out after 15s"));
    });

    req.end();
}

function transformGoogleSlidesHtml(html, targetBgColor, hideNavbar, isRemote, configuredRoute)
{
    if (!html || typeof html !== "string") return html;

    const route = configuredRoute || "/api/slides";
    let targetHex = (targetBgColor || "#abcdef").trim();
    if (!targetHex.startsWith("#")) targetHex = "#" + targetHex;

    const rgbObj = hexToRgb(targetHex);
    const rgbStr1 = rgbObj ? `rgb(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b})` : "";
    const rgbStr2 = rgbObj ? `rgb(${rgbObj.r},${rgbObj.g},${rgbObj.b})` : "";

    // 1. Static URL Pre-rewriting: Rewrite all embedded slide image URLs in the model data directly to the local image proxy
    const proxyPrefix = route + "/image?url=https%3A%2F%2Fdocs.google.com%2Fslides-images-rt%2F";
    html = html.split("https://docs.google.com/slides-images-rt/").join(proxyPrefix);
    html = html.split("https:\\/\\/docs.google.com\\/slides-images-rt\\/").join(proxyPrefix.replace(/\//g, "\\/"));

    // 2. Remove blocking headers/metas (CSP / X-Frame-Options) if embedded as meta tags
    html = html.replace(/<meta[^>]*http-equiv=["']?(Content-Security-Policy|X-Frame-Options)["']?[^>]*>/gi, "");

    // 3. Static SVG background replacement for fast initial render
    html = html.replace(/<path[^>]+fill=["']?(#abcdef|#ABCDEF)["']?[^>]*>/gi, (match) =>
    {
        return match.replace(/fill=["'][^"']+["']/i, 'fill="none" style="display:none!important;opacity:0!important;"');
    });

    // 4. Construct injected CSS rules
    const styleBlock = `
<!-- Cables Google Slides Transparency Injection -->
<style id="cables-transparent-slides-style">
  html, body,
  .sketchyViewerBody,
  .sketchyViewerContainer,
  .sketchyViewerContent,
  .punch-viewer-page-wrapper-container,
  .punch-viewer-page-wrapper,
  .appsSketchyViewerSvgPageComponentEl,
  .punch-viewer-svgpage-svgcontainer,
  .punch-viewer-content {
    background: transparent !important;
    background-color: transparent !important;
  }

  /* Hide preformatted slide background elements */
  svg path[fill="${targetHex}" i],
  svg rect[fill="${targetHex}" i],
  svg g[fill="${targetHex}" i]${rgbStr1 ? `,\n  svg path[fill="${rgbStr1}"], svg rect[fill="${rgbStr1}"]` : ""}${rgbStr2 ? `,\n  svg path[fill="${rgbStr2}"], svg rect[fill="${rgbStr2}"]` : ""} {
    display: none !important;
    opacity: 0 !important;
    fill: none !important;
    visibility: hidden !important;
  }

  /* Hide default Google Slides canvas white background rectangle */
  svg path[fill="#ffffff" i][d*="540"],
  svg path[fill="#ffffff" i][d^="m0 0l960"],
  svg path[fill="#ffffff" i][d^="M0 0L960"],
  svg path[fill="#fff" i][d*="540"],
  svg path[fill="#fff" i][d^="m0 0l960"],
  svg rect[fill="#ffffff" i][width="960"],
  svg rect[fill="#ffffff" i][width="100%"] {
    display: none !important;
    opacity: 0 !important;
    fill: none !important;
    visibility: hidden !important;
  }

  /* Completely hide and suppress Google Slides load error overlays */
  .sketchyViewerLoadErrorIcon,
  [class*="loadError" i],
  [class*="load-error" i],
  [class*="butterbar" i],
  [class*="butterBar" i],
  .punch-viewer-error-banner,
  .docs-butterbar-wrap,
  .docs-butterbar-container,
  .punch-viewer-notification-container,
  .punch-viewer-notification,
  .jfk-butterBar,
  div[role="alert"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
  }

  ${hideNavbar ? `
  .punch-viewer-navbar,
  .punch-viewer-navbar-container {
    display: none !important;
  }
  ` : ""}
</style>
`;

    // 5. Construct early-injected MutationObserver and Image Proxy Interceptor client script
    const scriptBlock = `
<script id="cables-transparent-slides-script">
(function() {
  var targetHex = "${targetHex.toLowerCase()}";
  var targetRgb1 = "${rgbStr1.toLowerCase()}";
  var targetRgb2 = "${rgbStr2.toLowerCase()}";
  var proxyBase = "${route}/image?url=";

  // Intercept HTMLImageElement.src to bypass Cross-Origin-Resource-Policy restrictions
  try {
    var imgProto = HTMLImageElement.prototype;
    var origSrcDesc = Object.getOwnPropertyDescriptor(imgProto, 'src');
    if (origSrcDesc && origSrcDesc.set) {
      Object.defineProperty(imgProto, 'src', {
        set: function(url) {
          if (typeof url === 'string' && (url.indexOf('slides-images-rt') !== -1 || url.indexOf('googleusercontent.com') !== -1)) {
            if (url.indexOf(proxyBase) === -1) {
              url = proxyBase + encodeURIComponent(url);
            }
          }
          return origSrcDesc.set.call(this, url);
        },
        get: function() {
          return origSrcDesc.get.call(this);
        }
      });
    }
  } catch(e) {}

  // Intercept window.fetch to route image requests through proxy and suppress telemetry CORS spam
  try {
    var origFetch = window.fetch;
    if (origFetch) {
      window.fetch = function(input, init) {
        if (typeof input === 'string') {
          if (input.indexOf('play.google.com/log') !== -1) {
            return Promise.resolve(new Response('{"status":"ok"}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
          }
          if (input.indexOf('slides-images-rt') !== -1 || input.indexOf('googleusercontent.com') !== -1) {
            if (input.indexOf(proxyBase) === -1) {
              input = proxyBase + encodeURIComponent(input);
            }
          }
        }
        return origFetch.call(this, input, init);
      };
    }
  } catch(e) {}

  // Intercept XMLHttpRequest for images
  try {
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
      if (typeof url === 'string') {
        if (url.indexOf('slides-images-rt') !== -1 || url.indexOf('googleusercontent.com') !== -1) {
          if (url.indexOf(proxyBase) === -1) {
            url = proxyBase + encodeURIComponent(url);
          }
        }
      }
      return origOpen.call(this, method, url, async, user, pass);
    };
  } catch(e) {}

  function cleanSlideElements(rootNode) {
    try {
      var root = rootNode || document;
      var paths = root.querySelectorAll('svg path, svg rect, svg polygon');
      for (var i = 0; i < paths.length; i++) {
        var el = paths[i];
        var fill = (el.getAttribute('fill') || '').toLowerCase().trim();
        var d = el.getAttribute('d') || '';

        if (fill === targetHex || (targetRgb1 && fill === targetRgb1) || (targetRgb2 && fill === targetRgb2)) {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.setAttribute('fill', 'none');
        } else if (fill === '#ffffff' || fill === '#fff' || fill === 'rgb(255, 255, 255)' || fill === 'rgb(255,255,255)') {
          if (d.indexOf('540') !== -1 || d.indexOf('960') !== -1 || d.startsWith('m0 0') || d.startsWith('M0 0')) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.setAttribute('fill', 'none');
          }
        }
      }

      // Suppress any loadError overlays, butterbars, or error icons
      var errorNodes = root.querySelectorAll('.sketchyViewerLoadErrorIcon, [class*="loadError" i], [class*="load-error" i], [class*="butterbar" i], [class*="butterBar" i], .jfk-butterBar, div[role="alert"]');
      for (var b = 0; b < errorNodes.length; b++) {
        var node = errorNodes[b];
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.style.setProperty('opacity', '0', 'important');
        node.style.setProperty('pointer-events', 'none', 'important');
        if (node.parentElement && node.parentElement !== document.body && node.parentElement.innerText && node.parentElement.innerText.indexOf("Parts of this slide") !== -1) {
          node.parentElement.style.setProperty('display', 'none', 'important');
        }
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { cleanSlideElements(); });
  } else {
    cleanSlideElements();
  }

  var observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i];
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (var j = 0; j < mutation.addedNodes.length; j++) {
          var node = mutation.addedNodes[j];
          if (node.nodeType === 1) {
            cleanSlideElements(node);
          }
        }
      }
    }
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
</script>
`;

    // 6. Inject base tag, styles, and scripts immediately at top of <head>
    const baseTag = (isRemote || !html.includes("<base ")) ? '<base href="https://docs.google.com/">\n' : '';
    const injectionHead = baseTag + styleBlock + "\n" + scriptBlock + "\n";

    if (html.includes("<head>"))
    {
        html = html.replace("<head>", "<head>\n" + injectionHead);
    }
    else if (html.includes("<head "))
    {
        html = html.replace(/<head[^>]*>/i, (m) => m + "\n" + injectionHead);
    }
    else if (html.includes("</head>"))
    {
        html = html.replace("</head>", injectionHead + "</head>");
    }
    else
    {
        html = injectionHead + html;
    }

    return html;
}
