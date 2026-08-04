// MathTutor AI - Legacy chat page logic (IE6-compatible).
(function ($) {
    "use strict";

    var messages = [];
    var chatHistory = [];
    var currentChat = null;
    var activeChatId = null;
    var input = "";
    var isLoading = false;
    var isStreaming = false;
    var pendingImage = null;
    var xhr = null;
    var stopRequested = false;
    var currentAssistantId = null;
    var assistantBuf = "";

    // ---------- Element cache ----------
    function el(id) {
        return document.getElementById(id);
    }

    // ---------- Language switcher ----------
    function buildLangSwitcher() {
        var host = el("langSwitcher");
        var html = '<select id="langSelect">';
        for (var i = 0; i < MathTutor.languages.length; i++) {
            var lang = MathTutor.languages[i];
            html += '<option value="' + lang.code + '">' + lang.name + "</option>";
        }
        html += "</select>";
        host.innerHTML = html;
        var sel = el("langSelect");
        sel.value = MathTutor.currentLanguage;
        $(sel).on("change", function () {
            MathTutor.setLanguage(this.value, reapplyUiTexts);
        });
    }

    function reapplyUiTexts() {
        MathTutor.applyLang(MathTutor.currentLanguage);
        var authLink = el("authLink");
        if (authLink) {
            authLink.textContent = MathTutor.isAuthenticated()
                ? MathTutor.t("sidebarSignOut")
                : MathTutor.t("sidebarSignIn");
        }
        var chatTitle = el("chatTitle");
        if (chatTitle && currentChat) {
            chatTitle.textContent = currentChat.title;
        }
        renderChatList();
        renderSidebarUserArea();
    }

    // ---------- Sidebar ----------
    function loadChatHistory() {
        MathTutor.api({
            url: "/api/chats",
            method: "GET",
            success: function (data) {
                chatHistory = data.chats || [];
                renderChatList();
            },
            error: function (msg) {
                chatHistory = [];
                renderChatList();
            }
        });
    }

    function renderChatList() {
        var listEl = el("chatList");
        var html = "";
        for (var i = 0; i < chatHistory.length; i++) {
            var chat = chatHistory[i];
            var title = chat.title || MathTutor.t("chatUntitled");
            var preview = chat.preview || title;
            html += '<li data-chat-id="' + MathTutor.escapeHtml(chat.id) + '">'
                + '<a href="#" class="sidebar-chat-title">' + MathTutor.escapeHtml(title) + "</a>"
                + '<span class="sidebar-chat-preview">' + MathTutor.escapeHtml(preview) + "</span>"
                + '<span class="sidebar-chat-actions">'
                + '<a href="#" data-action="open">' + MathTutor.escapeHtml(MathTutor.t("sidebarOpen")) + "</a>"
                + '<a href="#" data-action="rename">' + MathTutor.escapeHtml(MathTutor.t("sidebarRename")) + "</a>"
                + '<a href="#" data-action="pin">' + MathTutor.escapeHtml(MathTutor.t(chat.isPinned ? "sidebarUnpin" : "sidebarPinToTop")) + "</a>"
                + '<a href="#" data-action="delete">' + MathTutor.escapeHtml(MathTutor.t("sidebarDelete")) + "</a>"
                + "</span></li>";
        }
        if (!chatHistory.length) {
            html = '<li class="muted">' + MathTutor.escapeHtml(MathTutor.t("sidebarNoConversationsYet")) + "</li>";
        }
        listEl.innerHTML = html;
        fitSidebarList();

        $(listEl).off("click")
            .on("click", "a[data-action]", function (e) {
                e.preventDefault();
                e.stopPropagation();
                var li = $(this).closest("li")[0];
                var chatId = MathTutor.attr(li, "data-chat-id");
                var action = this.getAttribute("data-action");
                handleChatAction(chatId, action);
            })
            .on("click", "li", function (e) {
                if (e.target.getAttribute && e.target.getAttribute("data-action")) {
                    return;
                }
                e.preventDefault();
                var id = MathTutor.attr(this, "data-chat-id");
                if (id) {
                    selectChat(id);
                }
            });
    }

    function handleChatAction(chatId, action) {
        if (action === "open") {
            selectChat(chatId);
        } else if (action === "rename") {
            promptRename(chatId);
        } else if (action === "pin") {
            togglePin(chatId);
        } else if (action === "delete") {
            confirmDelete(chatId);
        }
    }

    function selectChat(chatId) {
        if (isLoading || isStreaming) {
            return;
        }
        setActiveChatId(chatId);
    }

    function setActiveChatId(chatId) {
        activeChatId = chatId;
        isLoading = true;
        isStreaming = false;
        showLoadingState();
        var chat = findChat(chatId);
        currentChat = chat || null;
        MathTutor.api({
            url: "/api/chats/" + encodeURIComponent(chatId),
            method: "GET",
            success: function (data) {
                messages = [];
                var rows = data.messages || [];
                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    messages.push({
                        id: row.id,
                        role: row.role,
                        content: row.content,
                        timestamp: row.created_at,
                        is_pinned: row.is_pinned === 1
                    });
                }
                currentChat = data.chat;
                activeChatId = chatId;
                renderMessages();
                renderSidebarUserArea();
                reapplyUiTexts();
                setIsLoading(false);
                showChatView();
                scrollMessagesToBottom();
            },
            error: function (msg) {
                messages = [];
                currentChat = null;
                activeChatId = null;
                renderMessages();
                setIsLoading(false);
                showWelcomeView();
            }
        });
    }

    function findChat(chatId) {
        for (var i = 0; i < chatHistory.length; i++) {
            if (chatHistory[i].id === chatId) {
                return chatHistory[i];
            }
        }
        return null;
    }

    function promptRename(chatId) {
        var chat = findChat(chatId);
        if (!chat) {
            return;
        }
        showModal(MathTutor.t("sidebarRename"), '<div class="field"><input type="text" id="renameInput" value="'
            + MathTutor.escapeHtml(chat.title) + '"></div>', function () {
            var title = el("renameInput").value;
            if (!title) {
                return;
            }
            MathTutor.api({
                url: "/api/chats/" + encodeURIComponent(chatId),
                method: "PATCH",
                data: { title: title },
                success: function (data) {
                    loadChatHistory();
                    if (currentChat && currentChat.id === chatId) {
                        currentChat.title = title;
                        reapplyUiTexts();
                    }
                    hideModal();
                },
                error: function (msg) {
                    alert(msg);
                }
            });
        }, function () {
            hideModal();
        });
    }

    function togglePin(chatId) {
        var chat = findChat(chatId);
        if (!chat) {
            return;
        }
        var next = !chat.isPinned;
        MathTutor.api({
            url: "/api/chats/" + encodeURIComponent(chatId),
            method: "PATCH",
            data: { is_archived: undefined, is_pinned: next, title: undefined, preview: undefined, topic: undefined },
            success: function () {
                updatePinLocally(chatId, next);
                loadChatHistory();
            },
            error: function (msg) {
                alert(msg);
            }
        });
    }

    // Re-order the in-memory list so the pinned chat displays at the top
    // immediately; the follow-up loadChatHistory() confirms server order.
    function updatePinLocally(chatId, isPinned) {
        for (var i = 0; i < chatHistory.length; i++) {
            if (chatHistory[i].id === chatId) {
                chatHistory[i].isPinned = isPinned;
                break;
            }
        }
        chatHistory.sort(function (a, b) {
            return ((b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
        });
        renderChatList();
    }

    function confirmDelete(chatId) {
        showModal(
            MathTutor.t("sidebarDeleteConfirmTitle"),
            '<p>' + MathTutor.escapeHtml(MathTutor.t("sidebarDeleteConfirm").replace("%s", chatTitle(chatId))) + "</p>",
            function () {
                MathTutor.api({
                    url: "/api/chats/" + encodeURIComponent(chatId),
                    method: "DELETE",
                    success: function () {
                        if (activeChatId === chatId) {
                            handleNewChat();
                        }
                        removeChatLocally(chatId);
                        loadChatHistory();
                        hideModal();
                    },
                    error: function (msg) {
                        alert(msg);
                    }
                });
            },
            function () {
                hideModal();
            }
        );
    }

    function chatTitle(chatId) {
        var chat = findChat(chatId);
        return chat ? chat.title : "";
    }

    // Drop the deleted chat from the in-memory list and re-render so the tab
    // is gone (and unclickable) right away, before the server reload returns.
    function removeChatLocally(chatId) {
        var next = [];
        for (var i = 0; i < chatHistory.length; i++) {
            if (chatHistory[i].id !== chatId) {
                next.push(chatHistory[i]);
            }
        }
        chatHistory = next;
        renderChatList();
    }

    function renderSidebarUserArea() {
        var area = el("sidebarUserArea");
        if (MathTutor.isAuthenticated()) {
            var user = MathTutor.currentUser();
            area.innerHTML = '<div class="muted">' + MathTutor.escapeHtml(user.name || user.email) + "</div>"
                + '<a href="/legacy/settings.html">' + MathTutor.escapeHtml(MathTutor.t("sidebarSettings")) + "</a>";
        } else {
            area.innerHTML = '<a href="/legacy/login.html">' + MathTutor.escapeHtml(MathTutor.t("sidebarSignIn")) + "</a>";
        }
    }

    // ---------- Message rendering ----------
    function renderMessages() {
        var area = el("messagesArea");
        var html = "";
        for (var i = 0; i < messages.length; i++) {
            html += renderMessageHtml(messages[i]);
        }
        if (isLoading && messages.length && messages[messages.length - 1].role === "user") {
            html += '<div class="msg-row msg-assistant"><div class="msg-role">'
                + MathTutor.escapeHtml(MathTutor.t("ciAIMathTutor"))
                + '</div><div class="msg-body loading-dots">...</div></div>';
        }
        area.innerHTML = html;
        scrollMessagesToBottom();
    }

    function renderMessageHtml(msg) {
        var role = msg.role === "user" ? MathTutor.t("chatYou") : MathTutor.t("ciAIMathTutor");
        var cls = msg.role === "user" ? "msg-user" : "msg-assistant";
        var actions = "";
        if (msg.role === "assistant") {
            actions = '<div class="msg-actions">'
                + '<a href="#" data-action="copy" data-msg-id="' + MathTutor.escapeHtml(msg.id) + '">'
                + MathTutor.escapeHtml(MathTutor.t("chatCopyMessage")) + "</a>"
                + '<a href="#" data-action="pin" data-msg-id="' + MathTutor.escapeHtml(msg.id) + '">'
                + MathTutor.escapeHtml(msg.is_pinned ? MathTutor.t("unpin") : MathTutor.t("pin")) + "</a>"
                + '<a href="#" data-action="regenerate" data-msg-id="' + MathTutor.escapeHtml(msg.id) + '">'
                + MathTutor.escapeHtml(MathTutor.t("chatRegenerate")) + "</a></div>";
        } else {
            actions = '<div class="msg-actions">'
                + '<a href="#" data-action="edit" data-msg-id="' + MathTutor.escapeHtml(msg.id) + '">'
                + MathTutor.escapeHtml(MathTutor.t("chatEditMessage")) + "</a></div>";
        }
        return '<div class="msg-row ' + cls + '" data-msg-id="' + MathTutor.escapeHtml(msg.id) + '">'
            + '<div class="msg-role">' + MathTutor.escapeHtml(role) + "</div>"
            + '<div class="msg-body">' + MathTutor.renderMarkdownSafe(msg.content) + "</div>"
            + '<div class="msg-time">' + MathTutor.escapeHtml(MathTutor.formatTime(msg.timestamp)) + "</div>"
            + actions
            + "</div>";
    }

    function appendAssistantChunk(text) {
        var area = el("messagesArea");
        var last = messages[messages.length - 1];
        if (last && last.id === currentAssistantId) {
            last.content += text;
            var rows = area.getElementsByTagName("div");
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                if (row.className && row.className.indexOf("msg-row") !== -1
                    && row.getAttribute("data-msg-id") === currentAssistantId) {
                    var children = row.getElementsByTagName("div");
                    for (var j = 0; j < children.length; j++) {
                        if (children[j].className === "msg-body") {
                            children[j].innerHTML = MathTutor.renderMarkdownSafe(last.content);
                            break;
                        }
                    }
                    break;
                }
            }
        }
        scrollMessagesToBottom();
    }

    function scrollMessagesToBottom() {
        var area = el("messagesArea");
        if (!area) {
            return;
        }
        setTimeout(function () {
            if (area.scrollHeight > area.clientHeight) {
                area.scrollTop = area.scrollHeight;
            }
        }, 0);
    }

    function showChatView() {
        el("welcomeSection").className = "welcome hidden";
        el("messagesArea").className = "messages";
        el("inputBar").className = "input-bar";
        el("headerNewChat").className = "header-btn";
        el("headerExport").className = "header-btn";
        el("headerNotes").className = "header-btn";
        el("headerShare").className = "header-btn";
        var row = el("chatBodyRow");
        if (row) {
            row.valign = "top";
        }
        fitMessages();
    }

    function fitMessages() {
        var area = el("messagesArea");
        if (!area || area.className.indexOf("hidden") !== -1) {
            return;
        }
        var row = el("chatBodyRow");
        var h = row ? row.clientHeight - 16 : 300;
        if (h < 160) {
            h = 300;
        }
        area.style.height = h + "px";
        area.style.maxHeight = "none";
    }

    function fitSidebarList() {
        var list = el("chatList");
        if (!list) {
            return;
        }
        var inner = list.parentNode;
        if (!inner || !inner.parentNode) {
            list.style.height = "300px";
            return;
        }
        var cell = inner.parentNode;
        var sections = cell.getElementsByTagName("div");
        var used = 0;
        for (var i = 0; i < sections.length; i++) {
            if (sections[i] !== inner) {
                used += sections[i].offsetHeight || 0;
            }
        }
        var h = (cell.clientHeight || 400) - used - 16;
        if (h < 100) {
            h = 300;
        }
        list.style.height = h + "px";
    }

    function fitAll() {
        fitMessages();
        fitSidebarList();
    }

    function showWelcomeView() {
        el("welcomeSection").className = "welcome";
        el("messagesArea").className = "messages hidden";
        var authenticated = MathTutor.isAuthenticated();
        el("inputBar").className = authenticated ? "input-bar" : "input-bar hidden";
        el("headerNewChat").className = "header-btn hidden";
        el("headerExport").className = "header-btn hidden";
        el("headerNotes").className = "header-btn hidden";
        el("headerShare").className = "header-btn hidden";
        var row = el("chatBodyRow");
        if (row) {
            row.valign = "middle";
        }
        var authPrompt = el("authPrompt");
        if (!authenticated) {
            authPrompt.className = "";
        } else {
            authPrompt.className = "hidden";
        }
        loadLearningCards();
    }

    // ---------- Quota banner (E) ----------
    function refreshQuota(xhr) {
        var banner = el("quotaBanner");
        if (!banner) {
            return;
        }
        var warn = false;
        try {
            warn = xhr.getResponseHeader && xhr.getResponseHeader("X-Quota-Warning") === "true";
        } catch (e) {
        }
        if (warn) {
            banner.className = "quota-banner";
        } else {
            banner.className = "quota-banner hidden";
        }
    }

    // ---------- Learning cards (B11 + B9) ----------
    function loadLearningCards() {
        var host = el("learningCards");
        if (!host) {
            return;
        }
        var html = "";
        $.ajax({
            url: API_BASE_URL + "/api/problem-of-day?language=" + encodeURIComponent(MathTutor.currentLanguage),
            dataType: "json",
            success: function (data) {
                var p = data && data.problem;
                if (p && p.question) {
                    html += '<a class="learning-card" href="/legacy/practice.html">'
                        + '<span class="learning-card-tag">' + MathTutor.escapeHtml(MathTutor.t("problemOfDay")) + "</span>"
                        + '<span class="learning-card-text">' + MathTutor.escapeHtml(p.question) + "</span></a>";
                }
                if (MathTutor.isAuthenticated()) {
                    $.ajax({
                        url: API_BASE_URL + "/api/review",
                        dataType: "json",
                        success: function (rd) {
                            var n = (rd && rd.items) ? rd.items.length : 0;
                            if (n > 0) {
                                html += '<a class="learning-card" href="/legacy/practice.html">'
                                    + '<span class="learning-card-tag">' + MathTutor.escapeHtml(MathTutor.t("reviewDue")) + "</span>"
                                    + '<span class="learning-card-text">' + n + " " + MathTutor.escapeHtml(MathTutor.t("reviewDueToday")) + "</span></a>";
                            }
                            host.innerHTML = html;
                        },
                        error: function () {
                            host.innerHTML = html;
                        }
                    });
                } else {
                    host.innerHTML = html;
                }
            },
            error: function () {
            }
        });
    }

    // ---------- Notes + Share (D18 + D19) ----------
    function handleNotes() {
        if (!activeChatId) {
            return;
        }
        MathTutor.api({
            url: "/api/chats/" + encodeURIComponent(activeChatId) + "/notes",
            method: "POST",
            data: { language: MathTutor.currentLanguage },
            success: function (data) {
                var note = data && data.note ? data.note : "";
                showModal(MathTutor.t("notes"), '<div class="note-text">' + MathTutor.escapeHtml(note) + "</div>",
                    function () {
                        hideModal();
                    });
            },
            error: function (msg) {
                alert(msg);
            }
        });
    }

    function handleShare() {
        if (!activeChatId) {
            return;
        }
        MathTutor.api({
            url: "/api/chats/" + encodeURIComponent(activeChatId) + "/share",
            method: "POST",
            data: {},
            success: function (data) {
                var url = (window.location.origin || "") + (data.url || "");
                if (window.clipboardData && window.clipboardData.setData) {
                    window.clipboardData.setData("Text", url);
                    alert(MathTutor.t("shareCopied"));
                } else {
                    prompt(MathTutor.t("shareCopied"), url);
                }
            },
            error: function (msg) {
                alert(msg);
            }
        });
    }

    function setIsLoading(value) {
        isLoading = value;
        var sendBtn = el("sendBtn");
        if (sendBtn) {
            sendBtn.disabled = value;
        }
        renderMessages();
    }

    function showLoadingState() {
        renderMessages();
    }

    // ---------- Send ----------
    function sendMessage(overrideInput) {
        var text = (overrideInput !== undefined ? overrideInput : el("chatInput").value).trim();
        if (!text || isLoading) {
            return;
        }
        isLoading = true;
        isStreaming = true;

        var userMsg = {
            id: "u-" + new Date().getTime(),
            role: "user",
            content: text,
            timestamp: new Date()
        };
        messages.push(userMsg);
        el("chatInput").value = "";
        showChatView();
        renderMessages();

        var body = {
            message: text,
            preferredLanguage: MathTutor.currentLanguage,
            chatId: activeChatId
        };
        currentAssistantId = "a-" + new Date().getTime();
        assistantBuf = "";
        messages.push({ id: currentAssistantId, role: "assistant", content: "", timestamp: new Date() });
        renderMessages();

        sendBtnVisible(false);
        streamRequest("/api/chat/message", body);
    }

    function sendImage() {
        if (!pendingImage || isLoading) {
            return;
        }
        isLoading = true;
        isStreaming = true;

        var caption = el("chatInput").value || MathTutor.t("inputImageDefaultCaption");
        var userMsg = {
            id: "u-" + new Date().getTime(),
            role: "user",
            content: "[Image] " + caption,
            timestamp: new Date()
        };
        messages.push(userMsg);
        el("chatInput").value = "";
        el("imgPreview").className = "img-preview hidden";
        var fileInput = el("imageInput");
        fileInput.value = "";
        pendingImage = null;
        showChatView();
        renderMessages();

        currentAssistantId = "a-" + new Date().getTime();
        assistantBuf = "";
        messages.push({ id: currentAssistantId, role: "assistant", content: "", timestamp: new Date() });
        renderMessages();

        var body = {
            image: pendingImageData,
            mimeType: pendingImageMime,
            message: caption,
            preferredLanguage: MathTutor.currentLanguage,
            chatId: activeChatId
        };
        sendBtnVisible(false);
        streamRequest("/api/chat/image", body);
    }

    // Streaming XHR (works on IE6 via readyState polling).
    function streamRequest(url, body) {
        var done = false;
        var lastLen = 0;

        function onProgress() {
            if (done) {
                return;
            }
            try {
                var text = xhr.responseText || "";
                if (text.length > lastLen) {
                    var chunk = text.substring(lastLen);
                    lastLen = text.length;
                    appendAssistantChunk(chunk);
                }
            } catch (e) {
            }
        }

        function onDone() {
            if (done) {
                return;
            }
            done = true;
            var serverChatId = xhr.getResponseHeader && xhr.getResponseHeader("X-Chat-Id");
            if (serverChatId && serverChatId !== activeChatId) {
                var wasNewChat = !activeChatId;
                activeChatId = serverChatId;
                if (wasNewChat) {
                    chatHistory.unshift({
                        id: serverChatId,
                        title: body.message.slice(0, 50) + (body.message.length > 50 ? "..." : ""),
                        timestamp: new Date().toISOString(),
                        preview: body.message.slice(0, 100),
                        topic: null,
                        isPinned: false,
                        messages: []
                    });
                    renderChatList();
                }
            }
            finishStreaming();
            refreshQuota(xhr);
            MathTutor.refreshUsage();
            loadChatHistory();
        }

        xhr = MathTutor.createXHR();
        if (!xhr) {
            finishStreaming();
            return;
        }
        stopRequested = false;
        var fullUrl = API_BASE_URL + url;
        xhr.open("POST", fullUrl, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 3) {
                onProgress();
            } else if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    onProgress();
                    onDone();
                } else {
                    if (!done) {
                        done = true;
                        if (stopRequested) {
                            finishStreaming();
                            return;
                        }
                        var errMsg = MathTutor.t("errorNetwork");
                        try {
                            var data = JSON.parse(xhr.responseText);
                            if (data && data.error) {
                                errMsg = data.error;
                            }
                        } catch (e) {
                        }
                        appendAssistantChunk(errMsg);
                        finishStreaming();
                    }
                }
            }
        };
        xhr.send(JSON.stringify(body));
    }

    function finishStreaming() {
        isLoading = false;
        isStreaming = false;
        xhr = null;
        sendBtnVisible(true);
        setIsLoading(false);
        if (currentAssistantId) {
            currentAssistantId = null;
        }
        renderMessages();
        scrollMessagesToBottom();
    }

    function sendBtnVisible(sendVisible) {
        var sendBtn = el("sendBtn");
        var stopBtn = el("stopBtn");
        if (sendVisible) {
            sendBtn.className = "btn btn-primary";
            stopBtn.className = "btn hidden";
        } else {
            sendBtn.className = "btn btn-primary hidden";
            stopBtn.className = "btn";
        }
    }

    // ---------- Regenerate / edit / stop / copy ----------
    function handleRegenerate() {
        if (isLoading || messages.length < 2) {
            return;
        }
        var lastUser = null;
        for (var i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === "user") {
                lastUser = messages[i];
                break;
            }
        }
        if (!lastUser) {
            return;
        }
        truncateTo(lastUser.id);
        el("chatInput").value = lastUser.content;
        sendMessage(lastUser.content);
    }

    function handleEdit(messageId) {
        var idx = findMsgIndex(messageId);
        if (idx < 0) {
            return;
        }
        var content = messages[idx].content;
        truncateTo(messageId);
        el("chatInput").value = content;
    }

    function truncateTo(messageId) {
        var idx = findMsgIndex(messageId);
        if (idx < 0) {
            return;
        }
        messages = messages.slice(0, idx);
        renderMessages();
    }

    function findMsgIndex(messageId) {
        for (var i = 0; i < messages.length; i++) {
            if (messages[i].id === messageId) {
                return i;
            }
        }
        return -1;
    }

    function handleCopy(messageId) {
        var idx = findMsgIndex(messageId);
        if (idx < 0) {
            return;
        }
        var text = messages[idx].content;
        window.clipboardData && window.clipboardData.setData
            ? window.clipboardData.setData("Text", text)
            : prompt(MathTutor.t("chatCopyMessage"), text);
    }

    // A5 pin/unpin: bookmarked explanations carry forward into the AI context.
    function togglePinMsg(messageId) {
        if (!activeChatId) {
            return;
        }
        var idx = findMsgIndex(messageId);
        if (idx < 0) {
            return;
        }
        var next = !messages[idx].is_pinned;
        messages[idx].is_pinned = next;
        renderMessages();
        MathTutor.api({
            url: "/api/chats/" + encodeURIComponent(activeChatId) + "/messages/" + encodeURIComponent(messageId) + "/pin",
            method: "POST",
            data: { pinned: next },
            error: function () {
            }
        });
    }

    // ---------- New chat ----------
    function handleNewChat() {
        if (isLoading || isStreaming) {
            return;
        }
        messages = [];
        currentChat = null;
        activeChatId = null;
        el("chatInput").value = "";
        renderMessages();
        showWelcomeView();
        renderSidebarUserArea();
    }

    // ---------- Export ----------
    function handleExport() {
        if (!messages.length) {
            return;
        }
        var title = currentChat ? currentChat.title : MathTutor.t("ciMathChat");
        var md = MathTutor.exportChat(messages, title, "md");
        MathTutor.download(md, title.replace(/[^a-zA-Z0-9]/g, "_") + ".md");
    }

    // ---------- Modal ----------
    function showModal(title, bodyHtml, okHandler, cancelHandler) {
        el("modalTitle").textContent = title;
        el("modalBody").innerHTML = bodyHtml;
        el("modalOverlay").className = "modal-overlay";
        el("modal").className = "modal";
        el("modalOk").onclick = okHandler;
        el("modalCancel").onclick = cancelHandler || function () {
            hideModal();
        };
    }

    function hideModal() {
        el("modalOverlay").className = "modal-overlay hidden";
        el("modal").className = "modal hidden";
    }

    // ---------- Image handling ----------
    var pendingImageData = "";
    var pendingImageMime = "";

    var hasFileReader = typeof FileReader !== "undefined";

    function handleImageSelect() {
        if (!hasFileReader) {
            // IE6 cannot read local files as data URLs; show a hint.
            alert(MathTutor.t("inputAttachImage") + ": " + MathTutor.t("toastGenericError"));
            return;
        }
        var fileInput = el("imageInput");
        var file = fileInput.files && fileInput.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            pendingImageData = e.target.result;
            pendingImageMime = file.type;
            pendingImage = { data: e.target.result, mimeType: file.type };
            el("imgPreview").className = "img-preview";
        };
        reader.readAsDataURL(file);
    }

    function clearImage() {
        pendingImage = null;
        pendingImageData = "";
        pendingImageMime = "";
        el("imageInput").value = "";
        el("imgPreview").className = "img-preview hidden";
    }

    // ---------- Auth link ----------
    function handleAuthLink() {
        if (MathTutor.isAuthenticated()) {
            MathTutor.api({
                url: "/api/auth/logout",
                method: "POST",
                success: function () {
                    MathTutor.session = null;
                    handleNewChat();
                    reapplyUiTexts();
                    renderSidebarUserArea();
                    location.href = "/legacy/login.html";
                },
                error: function () {
                    MathTutor.session = null;
                    location.href = "/legacy/login.html";
                }
            });
        } else {
            location.href = "/legacy/login.html";
        }
    }

    // ---------- Init ----------
    function init() {
        var savedLang = MathTutor.getCookie("preferred-language") || "en";
        MathTutor.currentLanguage = savedLang;
        MathTutor.applyLang(savedLang);
        MathTutor.applyTheme(MathTutor.getTheme());
        buildLangSwitcher();

        el("sendBtn").onclick = function () {
            sendMessage();
        };
        el("stopBtn").onclick = function () {
            stopRequested = true;
            if (xhr) {
                xhr.abort();
            }
            finishStreaming();
        };
        el("newChatBtn").onclick = function () {
            handleNewChat();
            return false;
        };
        el("headerNewChat").onclick = function () {
            handleNewChat();
            return false;
        };
        el("headerExport").onclick = function () {
            handleExport();
            return false;
        };
        el("headerNotes").onclick = function () {
            handleNotes();
            return false;
        };
        el("headerShare").onclick = function () {
            handleShare();
            return false;
        };
        el("checkBtn").onclick = function () {
            var inputEl = el("chatInput");
            var v = inputEl.value.trim();
            if (v.indexOf("/check ") !== 0) {
                inputEl.value = "/check " + v;
            }
            inputEl.focus();
            return false;
        };
        el("themeToggle").onclick = function () {
            var next = MathTutor.getTheme() === "dark" ? "light" : "dark";
            MathTutor.setTheme(next);
            return false;
        };
        el("authLink").onclick = function () {
            handleAuthLink();
            return false;
        };
        el("attachBtn").onclick = function () {
            el("imageInput").click();
        };
        el("imageInput").onchange = handleImageSelect;
        el("clearImage").onclick = function () {
            clearImage();
            return false;
        };

        var inputEl = el("chatInput");
        $(inputEl).on("keydown", function (e) {
            if (e.keyCode === 13 && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        el("chatSearch").onkeyup = function () {
            searchChats(this.value);
        };

        $(el("messagesArea")).on("click", "a[data-action]", function (e) {
            e.preventDefault();
            var action = this.getAttribute("data-action");
            var msgId = this.getAttribute("data-msg-id");
            if (action === "copy") {
                handleCopy(msgId);
            } else if (action === "pin") {
                togglePinMsg(msgId);
            } else if (action === "regenerate") {
                handleRegenerate();
            } else if (action === "edit") {
                handleEdit(msgId);
            }
        });

        $(".prompt-btn").each(function () {
            var btn = this;
            btn.onclick = function () {
                var key = btn.getAttribute("data-prompt-key");
                var text = MathTutor.t(key);
                el("chatInput").value = text;
                el("chatInput").focus();
            };
        });

        initKeyboardShortcuts();

        if (window.attachEvent) {
            window.attachEvent("onresize", fitAll);
        } else if (window.addEventListener) {
            window.addEventListener("resize", fitAll);
        } else {
            window.onresize = fitAll;
        }
        // Re-fit once layout has settled (IE6 height chains resolve late).
        setTimeout(fitAll, 250);
        setTimeout(fitAll, 800);

        MathTutor.refreshSession(function (ok) {
            reapplyUiTexts();
            renderSidebarUserArea();
            if (ok) {
                loadChatHistory();
                MathTutor.refreshUsage();
                showWelcomeView();
            } else {
                showWelcomeView();
            }
        });
    }

    function initKeyboardShortcuts() {
        $(document).on("keydown", function (e) {
            var ctrl = e.ctrlKey || e.metaKey;
            if (ctrl && e.keyCode === 78) { // Ctrl+N new chat
                e.preventDefault();
                handleNewChat();
            } else if (ctrl && e.keyCode === 69) { // Ctrl+E export
                e.preventDefault();
                handleExport();
            } else if (ctrl && e.keyCode === 191) { // Ctrl+/ help (no-op in legacy)
                e.preventDefault();
            } else if (ctrl && e.keyCode === 66) { // Ctrl+B toggle sidebar (no-op in legacy, two-pane)
                e.preventDefault();
            }
        });
    }

    function searchChats(query) {
        if (!query) {
            loadChatHistory();
            return;
        }
        MathTutor.api({
            url: "/api/chats?q=" + encodeURIComponent(query),
            method: "GET",
            success: function (data) {
                chatHistory = data.chats || [];
                renderChatList();
            },
            error: function () {
            }
        });
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        $(document).ready(init);
    }
})(jQuery);
