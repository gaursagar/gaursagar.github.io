/*global require,Blob,CodeMirror,JSHINT*/
/*global gallery_demos*/// defined by gallery/gallery-index.js, created by build
/*global sandcastleJsHintOptions*/// defined by jsHintOptions.js, created by build
require({
    baseUrl : '../../Source',
    packages : [{
        name : 'dojo',
        location : '../ThirdParty/dojo-release-1.9.3/dojo'
    }, {
        name : 'dijit',
        location : '../ThirdParty/dojo-release-1.9.3/dijit'
    }, {
        name : 'Sandcastle',
        location : '../Apps/Sandcastle'
    }, {
        name : 'Source',
        location : '.'
    }, {
        name : 'CodeMirror',
        location : '../ThirdParty/codemirror-4.6'
    }]
}, [
        'dijit/layout/ContentPane',
        'dijit/popup',
        'dijit/registry',
        'dijit/TooltipDialog',
        'dojo/_base/fx',
        'dojo/_base/xhr',
        'dojo/dom',
        'dojo/dom-class',
        'dojo/dom-construct',
        'dojo/io-query',
        'dojo/mouse',
        'dojo/on',
        'dojo/parser',
        'dojo/query',
        'Sandcastle/LinkButton',
        'Source/Cesium',
        'CodeMirror/lib/codemirror',
        'CodeMirror/addon/hint/show-hint',
        'CodeMirror/addon/hint/javascript-hint',
        'CodeMirror/mode/javascript/javascript',
        'CodeMirror/mode/css/css',
        'CodeMirror/mode/xml/xml',
        'CodeMirror/mode/htmlmixed/htmlmixed',
        'dijit/form/Button',
        'dijit/form/DropDownButton',
        'dijit/form/ToggleButton',
        'dijit/form/DropDownButton',
        'dijit/form/TextBox',
        'dijit/form/Textarea',
        'dijit/Menu',
        'dijit/MenuBar',
        'dijit/PopupMenuBarItem',
        'dijit/MenuItem',
        'dijit/layout/BorderContainer',
        'dijit/layout/TabContainer',
        'dijit/Toolbar',
        'dijit/ToolbarSeparator',
        'dojo/domReady!'
    ], function(
        ContentPane,
        popup,
        registry,
        TooltipDialog,
        fx,
        xhr,
        dom,
        domClass,
        domConstruct,
        ioQuery,
        mouse,
        on,
        parser,
        query,
        LinkButton,
        Cesium,
        CodeMirror) {
    "use strict";
    //In order for CodeMirror auto-complete to work, Cesium needs to be defined as a global.
    window.Cesium = Cesium;

    function defined(value) {
        return value !== undefined;
    }

    parser.parse();

    /*
        To Do: Implement Loading Notification
    */

    var numberOfNewConsoleMessages = 0;

    var logOutput = document.getElementById('logOutput');
    function appendConsole(className, message, showConsole) {
        var ele = document.createElement('span');
        ele.className = className;
        ele.textContent = message + '\n';
        logOutput.appendChild(ele);
        logOutput.parentNode.scrollTop = logOutput.clientHeight + 8 - logOutput.parentNode.clientHeight;
        if (showConsole) {
            hideGallery();
        } else {
            ++numberOfNewConsoleMessages;
            $('#bottomPanel a[href=#logContainer]').text('Console (' + numberOfNewConsoleMessages + ')');
        }
    }

    var URL = window.URL || window.webkitURL;

    function findCssStyle(selectorText) {
        for (var iSheets = 0, lenSheets = document.styleSheets.length; iSheets < lenSheets; ++iSheets) {
            var rules = document.styleSheets[iSheets].cssRules;
            for (var iRules = 0, lenRules = rules.length; iRules < lenRules; ++iRules) {
                if (rules[iRules].selectorText === selectorText) {
                    return rules[iRules];
                }
            }
        }
    }

    var jsEditor;
    var htmlEditor;
    var suggestButton = registry.byId('buttonSuggest');
    var docTimer;
    var docTabs = {};
    var subtabs = {};
    var docError = false;
    var galleryError = false;
    var galleryTooltipTimer;
    var activeGalleryTooltipDemo;
    var demoTileHeightRule = findCssStyle('.demoTileThumbnail');
    var cesiumContainer = registry.byId('cesiumContainer');
    var docNode = dom.byId('docPopup');
    var docMessage = dom.byId('docPopupMessage');
    var local = {
        'docTypes' : [],
        'headers' : '<html><head></head><body>',
        'bucketName' : '',
        'emptyBucket' : ''
    };
    var bucketTypes = {};
    var demoTooltips = {};
    var errorLines = [];
    var highlightLines = [];
    var searchTerm = '';
    var searchRegExp;
    var hintTimer;
    var currentTab = '';
    var newDemo;

    var galleryErrorMsg = document.createElement('span');
    galleryErrorMsg.className = 'galleryError';
    galleryErrorMsg.style.display = 'none';
    galleryErrorMsg.textContent = 'No demos match your search terms.';

    var bucketFrame = document.getElementById('bucketFrame');
    var bucketPane = registry.byId('bucketPane');
    var bucketWaiting = false;

    xhr.get({
        url : '../../Build/Documentation/types.txt',
        handleAs : 'json',
        error : function(error) {
            docError = true;
        }
    }).then(function(value) {
        local.docTypes = value;
    });

    var decoderSpan = document.createElement('span');
    function encodeHTML(text) {
        decoderSpan.textContent = text;
        text = decoderSpan.innerHTML;
        decoderSpan.innerHTML = '';
        return text;
    }
    function decodeHTML(text) {
        decoderSpan.innerHTML = text;
        text = decoderSpan.textContent;
        decoderSpan.innerHTML = '';
        return text;
    }

    function highlightRun() {
        domClass.add(registry.byId('buttonRun').domNode, 'highlightToolbarButton');
    }

    function clearRun() {
        domClass.remove(registry.byId('buttonRun').domNode, 'highlightToolbarButton');
    }

    function openDocTab(title, link) {
        if (!defined(docTabs[title])) {
            docTabs[title] = new ContentPane({
                title : title,
                focused : true,
                content : '<iframe class="fullFrame" src="' + link + '"></iframe>',
                closable : true,
                onClose : function() {
                    docTabs[this.title] = undefined;
                    // Return true to close the tab.
                    return true;
                }
            }).placeAt(cesiumContainer);
            // After the iframe loads, re-scroll to selected field.
            docTabs[title].domNode.childNodes[0].onload = function() {
                this.onload = function() {
                };
                this.src = link;
            };
            cesiumContainer.selectChild(docTabs[title]);
        } else {
            // Tab already exists, but maybe not visible.  Firefox needs the tab to
            // be revealed before a re-scroll can happen.  Chrome works either way.
            cesiumContainer.selectChild(docTabs[title]);
            docTabs[title].domNode.childNodes[0].src = link;
        }
    }

    function showDocPopup() {
        var selectedText = jsEditor.getSelection();
        var lowerText = selectedText.toLowerCase();

        var onDocClick = function() {
            openDocTab(this.textContent, this.href);
            return false;
        };

        docTimer = undefined;
        if (docError && selectedText && selectedText.length < 50) {
            hideGallery();
        } else if (lowerText && lowerText in local.docTypes && typeof local.docTypes[lowerText].push === 'function') {
            docMessage.innerHTML = '';
            for (var i = 0, len = local.docTypes[lowerText].length; i < len; ++i) {
                var member = local.docTypes[lowerText][i];
                var ele = document.createElement('a');
                ele.target = '_blank';
                ele.textContent = member.replace('.html', '').replace('module-', '').replace('#', '.');
                ele.href = '../../Build/Documentation/' + member;
                ele.onclick = onDocClick;
                docMessage.appendChild(ele);
            }
            jsEditor.addWidget(jsEditor.getCursor(true), docNode);
            docNode.style.top = (parseInt(docNode.style.top, 10) - 5) + 'px';
        }
    }

    function onCursorActivity() {
        docNode.style.left = '-999px';
        if (defined(docTimer)) {
            window.clearTimeout(docTimer);
        }
        docTimer = window.setTimeout(showDocPopup, 500);
    }

    function makeLineLabel(msg, className) {
        var element = document.createElement('abbr');
        element.className = className;
        element.innerHTML = '&nbsp;';
        element.title = msg;
        return element;
    }

    function closeGalleryTooltip() {
        if (defined(activeGalleryTooltipDemo)) {
            popup.close(demoTooltips[activeGalleryTooltipDemo.name]);
            activeGalleryTooltipDemo = undefined;
        }
    }

    // To Do: Tooltip Popups in Bootstraps
    function openGalleryTooltip() {
        /*galleryTooltipTimer = undefined;

        var selectedTabName = registry.byId('innerPanel').selectedChildWidget.title;
        var suffix = selectedTabName + 'Demos';
        if (selectedTabName === 'All') {
            suffix = '';
        } else if (selectedTabName === 'Search Results') {
            suffix = 'searchDemo';
        }

        if (defined(activeGalleryTooltipDemo)) {
            popup.open({
                popup : demoTooltips[activeGalleryTooltipDemo.name],
                around : dom.byId(activeGalleryTooltipDemo.name + suffix),
                orient : ['above', 'below']
            });
        }*/
    }

    function scheduleGalleryTooltip(demo) {
        if (demo !== activeGalleryTooltipDemo) {
            activeGalleryTooltipDemo = demo;
            if (defined(galleryTooltipTimer)) {
                window.clearTimeout(galleryTooltipTimer);
            }
            galleryTooltipTimer = window.setTimeout(openGalleryTooltip, 220);
        }
    }

    function scriptLineToEditorLine(line) {
        // editor lines are zero-indexed, plus 3 lines of boilerplate
        return line - 4;
    }

    function clearErrorsAddHints() {
        var line;
        var i;
        var len;
        hintTimer = undefined;
        closeGalleryTooltip();
        jsEditor.clearGutter('hintGutter');
        jsEditor.clearGutter('highlightGutter');
        jsEditor.clearGutter('errorGutter');
        jsEditor.clearGutter('searchGutter');
        while (errorLines.length > 0) {
            line = errorLines.pop();
            jsEditor.removeLineClass(line, 'text');
        }
        while (highlightLines.length > 0) {
            line = highlightLines.pop();
            jsEditor.removeLineClass(line, 'text');
        }
        var code = jsEditor.getValue();
        if (searchTerm !== '') {
            var codeLines = code.split('\n');
            for (i = 0, len = codeLines.length; i < len; ++i) {
                if (searchRegExp.test(codeLines[i])) {
                    line = jsEditor.setGutterMarker(i, 'searchGutter', makeLineLabel('Search: ' + searchTerm, 'searchMarker'));
                    jsEditor.addLineClass(line, 'text', 'searchLine');
                    errorLines.push(line);
                }
            }
        }
        // make a copy of the options, JSHint modifies the object it's given
        var options = JSON.parse(JSON.stringify(sandcastleJsHintOptions));
        if (!JSHINT(getScriptFromEditor(false), options)) {
            var hints = JSHINT.errors;
            for (i = 0, len = hints.length; i < len; ++i) {
                var hint = hints[i];
                if (hint !== null && defined(hint.reason) && hint.line > 0) {
                    line = jsEditor.setGutterMarker(scriptLineToEditorLine(hint.line), 'hintGutter', makeLineLabel(hint.reason, 'hintMarker'));
                    jsEditor.addLineClass(line, 'text', 'hintLine');
                    errorLines.push(line);
                }
            }
        }
    }

    function scheduleHint() {
        if (defined(hintTimer)) {
            window.clearTimeout(hintTimer);
        }
        hintTimer = setTimeout(clearErrorsAddHints, 550);
        highlightRun();
    }

    function scheduleHintNoChange() {
        if (defined(hintTimer)) {
            window.clearTimeout(hintTimer);
        }
        hintTimer = setTimeout(clearErrorsAddHints, 550);
    }

    function scrollToLine(lineNumber) {
        if (defined(lineNumber)) {
            jsEditor.setCursor(lineNumber);
            // set selection twice in order to force the editor to scroll
            // to this location if the cursor is already there
            jsEditor.setSelection({
                line : lineNumber - 1,
                ch : 0
            }, {
                line : lineNumber - 1,
                ch : 0
            });
            jsEditor.focus();
            jsEditor.setSelection({
                line : lineNumber,
                ch : 0
            }, {
                line : lineNumber,
                ch : 0
            });
        }
    }

    function highlightLine(lineNum) {
        var line;
        jsEditor.clearGutter('highlightGutter');
        while (highlightLines.length > 0) {
            line = highlightLines.pop();
            jsEditor.removeLineClass(line, 'text');
        }
        if (lineNum > 0) {
            lineNum = scriptLineToEditorLine(lineNum);
            line = jsEditor.setGutterMarker(lineNum, 'highlightGutter', makeLineLabel('highlighted by demo', 'highlightMarker'));
            jsEditor.addLineClass(line, 'text', 'highlightLine');
            highlightLines.push(line);
            scrollToLine(lineNum);
        }
    }

    var tabs = registry.byId('bottomPanel');

    //To do: Modify/Remove dependent functions
    function showGallery() {
        // tabs.selectChild(registry.byId('innerPanel'));
    }

    function hideGallery() {
        /* closeGalleryTooltip();
         tabs.selectChild(registry.byId('logContainer'));
        */
    }

    //No longer Needed
    /*tabs.watch('selectedChildWidget', function(name, oldValue, newValue) {
        if (newValue === registry.byId('logContainer')) {
            numberOfNewConsoleMessages = 0;
            registry.byId('logContainer').set('title', 'Console');
        }
    });*/

    //To do: Fix the console warning
    function registerScroll(demoContainer) {
        /*if (defined(document.onmousewheel)) {
            demoContainer.addEventListener('mousewheel', function(e) {
                if (defined(e.wheelDelta) && e.wheelDelta) {
                    demoContainer.scrollLeft -= e.wheelDelta * 70 / 120;
                }
            }, false);
        } else {
            demoContainer.addEventListener('DOMMouseScroll', function(e) {
                if (defined(e.detail) && e.detail) {
                    demoContainer.scrollLeft += e.detail * 70 / 3;
                }
            }, false);
        }*/
    }

    //Essential Function : DO NOT REMOVE
    CodeMirror.commands.runCesium = function(cm) {
        clearErrorsAddHints();
        /* clearRun();
        cesiumContainer.selectChild(bucketPane);*/
        // Check for a race condition in some browsers where the iframe hasn't loaded yet.
        if (bucketFrame.contentWindow.location.href.indexOf('bucket.html') > 0) {
            bucketFrame.contentWindow.location.reload();
        }
    };

    jsEditor = CodeMirror.fromTextArea(document.getElementById('code'), {
        mode : 'javascript',
        gutters : ['hintGutter', 'errorGutter', 'searchGutter', 'highlightGutter'],
        lineNumbers : true,
        matchBrackets : true,
        indentUnit : 4,
        extraKeys : {
            'Ctrl-Space' : 'autocomplete',
            'F8' : 'runCesium',
            'Tab' : 'indentMore',
            'Shift-Tab' : 'indentLess'
        }
    });

    // Fix the following two (they somehow break the program)
    // jsEditor.on('cursorActivity', onCursorActivity);
    // jsEditor.on('change', scheduleHint);

    //Not working for some reason
    htmlEditor = CodeMirror.fromTextArea(document.getElementById('htmlBody'), {
        mode : 'text/html',
        lineNumbers : true,
        matchBrackets : true,
        indentUnit : 4,
        extraKeys : {
            'F8' : 'runCesium',
            'Tab' : 'indentMore',
            'Shift-Tab' : 'indentLess'
        }
    });

    function getScriptFromEditor(addExtraLine) {
        return 'function startup(Cesium) {\n' +
               '    "use strict";\n' +
               '//Sandcastle_Begin\n' +
               (addExtraLine ? '\n' : '') +
               jsEditor.getValue() +
               '//Sandcastle_End\n' +
               '    Sandcastle.finishedLoading();\n' +
               '}\n' +
               'if (typeof Cesium !== "undefined") {\n' +
               '    startup(Cesium);\n' +
               '} else if (typeof require === "function") {\n' +
               '    require(["Cesium"], startup);\n' +
               '}\n';
    }

    var scriptCodeRegex = /\/\/Sandcastle_Begin\s*([\s\S]*)\/\/Sandcastle_End/;

    function activateBucketScripts(bucketDoc) {
        var headNodes = bucketDoc.head.childNodes;
        var node;
        var nodes = [];
        for (var i = 0, len = headNodes.length; i < len; ++i) {
            node = headNodes[i];
            // header is included in blank frame.
            if (node.tagName === 'SCRIPT' && node.src.indexOf('Sandcastle-header.js') < 0) {
                nodes.push(node);
            }
        }

        for (i = 0, len = nodes.length; i < len; ++i) {
            bucketDoc.head.removeChild(nodes[i]);
        }

        // Apply user HTML to bucket.
        var htmlElement = bucketDoc.createElement('div');
        htmlElement.innerHTML = htmlEditor.getValue();
        bucketDoc.body.appendChild(htmlElement);

        var onScriptTagError = function() {
            if (bucketFrame.contentDocument === bucketDoc) {
                appendConsole('consoleError', 'Error loading ' + this.src, true);
                appendConsole('consoleError', "Make sure Cesium is built, see the Contributor's Guide for details.", true);
            }
        };

        // Load each script after the previous one has loaded.
        var loadScript = function() {
            if (bucketFrame.contentDocument !== bucketDoc) {
                // A newer reload has happened, abort this.
                return;
            }
            if (nodes.length > 0) {
                node = nodes.shift();
                var scriptElement = bucketDoc.createElement('script');
                var hasSrc = false;
                for (var j = 0, numAttrs = node.attributes.length; j < numAttrs; ++j) {
                    var name = node.attributes[j].name;
                    var val = node.attributes[j].value;
                    scriptElement.setAttribute(name, val);
                    if (name === 'src' && val) {
                        hasSrc = true;
                    }
                }
                scriptElement.innerHTML = node.innerHTML;
                if (hasSrc) {
                    scriptElement.onload = loadScript;
                    scriptElement.onerror = onScriptTagError;
                    bucketDoc.head.appendChild(scriptElement);
                } else {
                    bucketDoc.head.appendChild(scriptElement);
                    loadScript();
                }
            } else {
                // Apply user JS to bucket
                var element = bucketDoc.createElement('script');

                // Firefox line numbers are zero-based, not one-based.
                var isFirefox = navigator.userAgent.indexOf('Firefox/') >= 0;

                element.textContent = getScriptFromEditor(isFirefox);
                bucketDoc.body.appendChild(element);
            }
        };
        loadScript();
    }

    function applyBucket() {
        if (local.emptyBucket && local.bucketName && typeof bucketTypes[local.bucketName] === 'string') {
            bucketWaiting = false;
            var bucketDoc = bucketFrame.contentDocument;
            if (local.headers.substring(0, local.emptyBucket.length) !== local.emptyBucket) {
                appendConsole('consoleError', 'Error, first part of ' + local.bucketName + ' must match first part of bucket.html exactly.', true);
            } else {
                var bodyAttributes = local.headers.match(/<body([^>]*?)>/)[1];
                var attributeRegex = /([-a-z_]+)\s*="([^"]*?)"/ig;
                //group 1 attribute name, group 2 attribute value.  Assumes double-quoted attributes.
                var attributeMatch;
                while ((attributeMatch = attributeRegex.exec(bodyAttributes)) !== null) {
                    var attributeName = attributeMatch[1];
                    var attributeValue = attributeMatch[2];
                    if (attributeName === 'class') {
                        bucketDoc.body.className = attributeValue;
                    } else {
                        bucketDoc.body.setAttribute(attributeName, attributeValue);
                    }
                }

                var pos = local.headers.indexOf('</head>');
                var extraHeaders = local.headers.substring(local.emptyBucket.length, pos);
                bucketDoc.head.innerHTML += extraHeaders;
                activateBucketScripts(bucketDoc);
            }
        } else {
            bucketWaiting = true;
        }
    }

    function applyBucketIfWaiting() {
        if (bucketWaiting) {
            applyBucket();
        }
    }

    xhr.get({
        url : 'templates/bucket.html',
        handleAs : 'text'
    }).then(function(value) {
        var pos = value.indexOf('</head>');
        local.emptyBucket = value.substring(0, pos);
        applyBucketIfWaiting();
    });

    function loadBucket(bucketName) {
        if (local.bucketName !== bucketName) {
            local.bucketName = bucketName;
            if (defined(bucketTypes[bucketName])) {
                local.headers = bucketTypes[bucketName];
            } else {
                local.headers = '<html><head></head><body data-sandcastle-bucket-loaded="no">';
                xhr.get({
                    url : 'templates/' + bucketName,
                    handleAs : 'text'
                }).then(function(value) {
                    var pos = value.indexOf('<body');
                    pos = value.indexOf('>', pos);
                    bucketTypes[bucketName] = value.substring(0, pos + 1);
                    if (local.bucketName === bucketName) {
                        local.headers = bucketTypes[bucketName];
                    }
                    applyBucketIfWaiting();
                });
            }
        }
    }

    function loadFromGallery(demo) {
        document.getElementById('saveAsFile').download = demo.name + '.html';
        $('#description').text(decodeHTML(demo.description).replace(/\\n/g, '\n'));
        $('#label').text(decodeHTML(demo.label).replace(/\\n/g, '\n'));

        //requestDemo is synchronous
        requestDemo(demo.name).then(function(value) {
            demo.code = value;
        });

        var parser = new DOMParser();
        var doc = parser.parseFromString(demo.code, 'text/html');

        var script = doc.querySelector('script[id="cesium_sandcastle_script"]');
        if (!script) {
            appendConsole('consoleError', 'Error reading source file: ' + demo.name, true);
            return;
        }

        var scriptMatch = scriptCodeRegex.exec(script.textContent);
        if (!scriptMatch) {
            appendConsole('consoleError', 'Error reading source file: ' + demo.name, true);
            return;
        }

        var scriptCode = scriptMatch[1];
        jsEditor.setValue(scriptCode);
        jsEditor.clearHistory();

        var htmlText = '';
        var childIndex = 0;
        var childNode = doc.body.childNodes[childIndex];
        while (childIndex < doc.body.childNodes.length && childNode !== script) {
            htmlText += childNode.nodeType === 1 ? childNode.outerHTML : childNode.nodeValue;
            childNode = doc.body.childNodes[++childIndex];
        }
        htmlText = htmlText.replace(/^\s+/, '');

        htmlEditor.setValue(htmlText);
        htmlEditor.clearHistory();

        if (typeof demo.bucket === 'string') {
            loadBucket(demo.bucket);
        }
        CodeMirror.commands.runCesium(jsEditor);
    }

    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.name && e.state.code) {
            loadFromGallery(e.state);
            document.title = e.state.name + ' - Cesium Sandcastle';
        }
    }, false);

    window.addEventListener('message', function(e) {
        var line;
        // The iframe (bucket.html) sends this message on load.
        // This triggers the code to be injected into the iframe.
        if (e.data === 'reload') {
            var bucketDoc = bucketFrame.contentDocument;
            if (!local.bucketName) {
                // Reload fired, bucket not specified yet.
                return;
            }
            if (bucketDoc.body.getAttribute('data-sandcastle-loaded') !== 'yes') {
                bucketDoc.body.setAttribute('data-sandcastle-loaded', 'yes');
                logOutput.innerHTML = '';
                numberOfNewConsoleMessages = 0;
                $('#bottomPanel a[href=#logContainer]').text('Console');
                // This happens after a Run (F8) reloads bucket.html, to inject the editor code
                // into the iframe, causing the demo to run there.
                applyBucket();
                if (docError) {
                    appendConsole('consoleError', 'Documentation not available.  Please run the "generateDocumentation" build script to generate Cesium documentation.', true);
                    showGallery();
                }
                if (galleryError) {
                    appendConsole('consoleError', 'Error loading gallery, please run the build script.', true);
                }
            }
        } else if (defined(e.data.log)) {
            // Console log messages from the iframe display in Sandcastle.
            appendConsole('consoleLog', e.data.log, false);
        } else if (defined(e.data.error)) {
            // Console error messages from the iframe display in Sandcastle
            var errorMsg = e.data.error;
            var lineNumber = e.data.lineNumber;
            if (defined(lineNumber)) {
                errorMsg += ' (on line ';

                if (e.data.url) {
                    errorMsg += lineNumber + ' of ' + e.data.url + ')';
                } else {
                    lineNumber = scriptLineToEditorLine(lineNumber);
                    errorMsg += (lineNumber + 1) + ')';
                    line = jsEditor.setGutterMarker(lineNumber, 'errorGutter', makeLineLabel(e.data.error, 'errorMarker'));
                    jsEditor.addLineClass(line, 'text', 'errorLine');
                    errorLines.push(line);
                    scrollToLine(lineNumber);
                }
            }
            appendConsole('consoleError', errorMsg, true);
        } else if (defined(e.data.warn)) {
            // Console warning messages from the iframe display in Sandcastle.
            appendConsole('consoleWarn', e.data.warn, true);
        } else if (defined(e.data.highlight)) {
            // Hovering objects in the embedded Cesium window.
            highlightLine(e.data.highlight);
        }
    }, true);

    //To do : Implement with bootstrap
    $('#search').on('change', function() {
        searchTerm = $('#search').text();
        searchRegExp = new RegExp(searchTerm, 'i');
        var numDemosShown = 0;
        if (searchTerm !== '') {
            showSearchContainer();
            var innerPanel = registry.byId('innerPanel');
            innerPanel.selectChild(registry.byId('searchContainer'));
            for (var i = 0; i < gallery_demos.length; i++) {
                var demo = gallery_demos[i];
                var demoName = demo.name;
                if (searchRegExp.test(demoName) || searchRegExp.test(demo.code)) {
                    document.getElementById(demoName + 'searchDemo').style.display = 'inline-block';
                    ++numDemosShown;
                } else {
                    document.getElementById(demoName + 'searchDemo').style.display = 'none';
                }
            }
        } else {
            hideSearchContainer();
        }

        if (numDemosShown) {
            galleryErrorMsg.style.display = 'none';
        } else {
            galleryErrorMsg.style.display = 'inline-block';
        }

        showGallery();
        scheduleHintNoChange();
    });

    //Need to be reimplemented
    function hideSearchContainer() {
        if (dom.byId('searchContainer')) {
            var innerPanel = registry.byId('innerPanel');
            innerPanel.removeChild(searchContainer);
        }
    }

    //Need to be reimplemented
    function showSearchContainer() {
        if (!dom.byId('searchContainer')) {
            var innerPanel = registry.byId('innerPanel');
            innerPanel.addChild(searchContainer);
        }
    }
    
    /* Button functions were reused; dojo replaced with jquery*/
    // Clicking the 'Run' button simply reloads the iframe.
    $('#buttonRun').on('click', function() {
        CodeMirror.commands.runCesium(jsEditor);
    });

    $('#buttonSuggest').on('click', function() {
        CodeMirror.commands.autocomplete(jsEditor);
    });

    function getDemoHtml() {
        return local.headers + '\n' +
               htmlEditor.getValue() +
               '<script id="cesium_sandcastle_script">\n' +
               getScriptFromEditor(false) +
               '</script>\n' +
               '</body>\n' +
               '</html>\n';
    }

    $('#dropDownSaveAs').on('click', function(){
        var currentDemoName = ioQuery.queryToObject(window.location.search.substring(1)).src;
        currentDemoName = currentDemoName.replace('.html', '');
        var description = encodeHTML($('#description').text().replace(/\n/g, '\\n')).replace(/\"/g, '&quot;');
        var label = encodeHTML($('#label').text().replace(/\n/g, '\\n')).replace(/\"/g, '&quot;');

        var html = getDemoHtml();
        html = html.replace('<title>', '<meta name="description" content="' + description + '">\n    <title>');
        html = html.replace('<title>', '<meta name="cesium-sandcastle-labels" content="' + label + '">\n    <title>');

        var octetBlob = new Blob([html], {
            'type' : 'application/octet-stream',
            'endings' : 'native'
        });
        var octetBlobURL = URL.createObjectURL(octetBlob);
        $('#saveAsFile').attr('href',octetBlobURL);
    });
    
    $('#buttonRun').on('click', function(){
        CodeMirror.commands.runCesium(jsEditor);
    });
    
    $('#buttonNewWindow').on('click', function(){
        var baseHref = window.location.href;
        var pos = baseHref.lastIndexOf('/');
        baseHref = baseHref.substring(0, pos) + '/gallery/';

        var html = getDemoHtml();
        html = html.replace('<head>', '<head>\n    <base href="' + baseHref + '">');
        var htmlBlob = new Blob([html], {
            'type' : 'text/html;charset=utf-8',
            'endings' : 'native'
        });
        var htmlBlobURL = URL.createObjectURL(htmlBlob);
        window.open(htmlBlobURL, '_blank');
        window.focus();
    });

    //Problem : How to make thumbnail of a canvas?
    $('#buttonThumbnail').on('click', function() {
        // if (newValue) {
        //     domClass.add('bucketFrame', 'makeThumbnail');
        // } else {
        //     domClass.remove('bucketFrame', 'makeThumbnail');
        // }
        $( "#bucketFrame" ).width(200).height(150);
    });

    var demoContainers = query('.demosContainer');
    demoContainers.forEach(function(demoContainer) {
        registerScroll(demoContainer);
    });

    var queryObject = {};
    if (window.location.search) {
        queryObject = ioQuery.queryToObject(window.location.search.substring(1));
    } else {
        queryObject.src = 'Hello World.html';
        queryObject.label = 'Showcases';
    }

    function requestDemo(name) {
        return xhr.get({
            url : 'gallery/' + name + '.html',
            handleAs : 'text',
            sync : true,
            error : function(error) {
                appendConsole('consoleError', error, true);
                galleryError = true;
            }
        });
    }

    function loadDemoFromFile(index) {
        var demo = gallery_demos[index];

        requestDemo(demo.name).then(function(value) {
            // Store the file contents for later searching.
            demo.code = value;

            var parser = new DOMParser();
            var doc = parser.parseFromString(value, 'text/html');

            var bucket = doc.body.getAttribute('data-sandcastle-bucket');
            demo.bucket = bucket ? bucket : 'bucket-requirejs.html';

            var descriptionMeta = doc.querySelector('meta[name="description"]');
            var description = descriptionMeta && descriptionMeta.getAttribute('content');
            demo.description = description ? description : '';

            var labelsMeta = doc.querySelector('meta[name="cesium-sandcastle-labels"]');
            var labels = labelsMeta && labelsMeta.getAttribute('content');
            demo.label = labels ? labels : '';

            // Select the demo to load upon opening based on the query parameter.
            if (defined(queryObject.src)) {
                if (demo.name === queryObject.src.replace('.html', '')) {
                    loadFromGallery(demo);
                    window.history.replaceState(demo, demo.name, '?src=' + demo.name + '.html&label=' + queryObject.label);
                    document.title = demo.name + ' - Cesium Sandcastle';
                }
            }

            // Create a tooltip containing the demo's description.
            demoTooltips[demo.name] = new TooltipDialog({
                id : demo.name + 'TooltipDialog',
                style : 'width: 200px; font-size: 12px;',
                content : demo.description.replace(/\\n/g, '<br/>')
            });

            addFileToTab(index);
        });
    }

    function setSubtab(tabName) {
        currentTab = defined(queryObject.label) ? queryObject.label : tabName;
        queryObject.label = undefined;
    }

    function addFileToGallery(index) {
        var searchDemos = $('#searchDemos');
        createGalleryButton(index, searchDemos, 'searchDemo');
        loadDemoFromFile(index);
    }

    function onShowCallback() {
        return function() {
            setSubtab(this.title);
        };
    }

       function addFileToTab(index) {
        var demo = gallery_demos[index];
        if (demo.label !== '') {
            var labels = demo.label.split(',');
            for (var j = 0; j < labels.length; j++) {
                var label = labels[j];
                label = label.trim();
                var _labelID = '#' + label + 'Demos';
                if (!$(_labelID).length) {
                    $('<li role="presentation"><a href="#'+label+'" role="tab" data-toggle="pill">' + label + '</a></li>').appendTo('#innerPanel ul');
                    $('<div role="tabpanel" class="tab-pane" id="'+label+'"><div class="demos" id="' + label + 'Demos"></div></div>').appendTo('#innerPanel .tab-content');
                    // $('#innerPanel').append('<div id="' + label + 'Container" class="demosContainer"><div class="demos" id="' + label + 'Demos"></div></div>');
                    // subtabs[label] = cp;
                    // registerScroll(dom.byId(label + 'Container'));
                }
                var tabName = label + 'Demos';
                var tab = $('#'+tabName);
                createGalleryButton(index, tab, tabName);
            }
        }
    }

    function createGalleryButton(index, tab, tabName) {
        var demo = gallery_demos[index];
        var imgSrc = 'templates/Gallery_tile.jpg';
        if (defined(demo.img)) {
            imgSrc = 'gallery/' + demo.img;
        }

        var demoLink = document.createElement('a');
        demoLink.id = demo.name + tabName;
        demoLink.className = 'linkButton';
        demoLink.href = 'gallery/' + encodeURIComponent(demo.name) + '.html';
        tab.append(demoLink);

        if(demo.name === "Hello World") {
            newDemo = demo;
        }
        demoLink.onclick = function(e) {
            if (mouse.isMiddle(e)) {
                window.open('gallery/' + demo.name + '.html');
            } else {
                loadFromGallery(demo);
                var demoSrc = demo.name + '.html';
                if (demoSrc !== window.location.search.substring(1)) {
                    window.history.pushState(demo, demo.name, '?src=' + demoSrc + '&label=' + currentTab);
                }
                document.title = demo.name + ' - Cesium Sandcastle';
            }
            e.preventDefault();
        };

        $(demoLink).append('<div class="demoTileTitle">' + demo.name + '</div><img src="' + imgSrc + '" class="demoTileThumbnail" alt="" onDragStart="return false;" />');

        // on(dom.byId(demoLink.id), 'mouseover', function() {
        //     scheduleGalleryTooltip(demo);
        // });

        // on(dom.byId(demoLink.id), 'mouseout', function() {
        //     closeGalleryTooltip();
        // });
    }

    if (!defined(gallery_demos)) {
        galleryErrorMsg.textContent = 'No demos found, please run the build script.';
        galleryErrorMsg.style.display = 'inline-block';
    } else {
        var label = 'Showcases';
        $('<li role="presentation" class="active"><a href="#showcases" data-toggle="tab">Showcases</a></li>').appendTo('#innerPanel ul');
        $('<div class="tab-pane active" id="showcases" role="tabpanel" ><div class="demos" id="ShowcasesDemos"></div></div>').appendTo('#innerPanel .tab-content');

        var i;
        var len = gallery_demos.length;

        // Sort alphabetically.  This will eventually be a user option.
        gallery_demos.sort(function(a, b) {
            var aName = a.name.toUpperCase();
            var bName = b.name.toUpperCase();
            return bName < aName ? 1 : bName > aName ? -1 : 0;
        });

        var queryInGalleryIndex = false;
        var queryName = queryObject.src.replace('.html', '');
        for (i = 0; i < len; ++i) {
            addFileToGallery(i);
            if (gallery_demos[i].name === queryName) {
                queryInGalleryIndex = true;
            }
        }

        label = 'All';
        $('<li role="presentation"><a href="#'+label+'" role="tab" data-toggle="tab">' + label + '</a></li>').appendTo(('#innerPanel ul'));
        $('<div role="tabpanel" class="tab-pane" id="' + label + '"><div class="demos" id="'+label+'Demos"></div></div>').appendTo('#innerPanel .tab-content');
        // subtabs[label] = cp;
        registerScroll(dom.byId('allContainer'));

        var demos = $('#'+label+'Demos');
        for (i = 0; i < len; ++i) {
            if (!/Development/i.test(gallery_demos[i].label)) {
                createGalleryButton(i, demos, 'all');
            }
        }

        if (!queryInGalleryIndex) {
            gallery_demos.push({
                name : queryName,
                description : ''
            });
            addFileToGallery(gallery_demos.length - 1);
        }
    }

    hideSearchContainer();
});

