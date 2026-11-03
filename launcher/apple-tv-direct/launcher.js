(function (window, document) {
    'use strict';
    var target = 'com.samsung.tv.aria-video';
    var attempted = false, pending = false, closed = false, generation = 0;
    var status = document.getElementById('status'), retry = document.getElementById('retry');
    function safeError(error) {
        var name = error && error.name;
        return /^(NotFoundError|NotSupportedError|SecurityError|InvalidValuesError|TypeMismatchError|InvalidStateError|UnknownError|TypeError|ReferenceError)$/.test(name || '') ? name : 'LAUNCH_FAILED';
    }
    function closeHelper() {
        if (closed) { return; }
        closed = true; pending = false; generation += 1; retry.disabled = true;
        try { window.tizen.application.getCurrentApplication().exit(); }
        catch (ignore) { status.textContent = 'Helper stopped. Press Home to leave.'; }
    }
    function launch() {
        var application, token, settled = false;
        if (closed || pending) { return; }
        attempted = true; pending = true; token = ++generation; retry.disabled = true;
        status.textContent = 'Opening Apple TV...';
        function active() { return !closed && !settled && token === generation; }
        function failed(error) {
            if (!active()) { return; }
            settled = true; pending = false; retry.disabled = false;
            status.textContent = 'Could not open Apple TV (' + safeError(error) + '). Press OK to try again, or Back to exit.';
        }
        application = window.tizen && window.tizen.application;
        if (!application || typeof application.launch !== 'function') {
            settled = true; pending = false; retry.disabled = false;
            status.textContent = 'Device launch API unavailable (API_UNAVAILABLE). Press OK to check again, or Back to exit.';
            return;
        }
        try {
            application.launch(target, function () {
                if (!active()) { return; }
                settled = true; pending = false;
                status.textContent = 'Apple TV launch accepted. Closing this helper.';
                closeHelper();
            }, failed);
        } catch (error) { failed(error); }
    }
    function onLoad() { if (!attempted && !closed) { launch(); } }
    retry.addEventListener('click', launch);
    document.addEventListener('keydown', function (event) {
        if (event.keyCode === 10009 || event.keyCode === 27) { event.preventDefault(); closeHelper(); }
        else if (event.keyCode === 13) { event.preventDefault(); launch(); }
    });
    window.addEventListener('load', onLoad);
    window.addEventListener('unload', function () { closed = true; generation += 1; });
    if (document.readyState === 'complete') { onLoad(); }
}(window, document));
