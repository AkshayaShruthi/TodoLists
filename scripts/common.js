    function hideLoading(div) {
        document.getElementById(div).className = "hide";
    }

    function showLoading(div) {
        document.getElementById(div).className = "";
    }

    function fetchPage(url, element) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    document.getElementById(element).innerHTML = request.response;
                }
            }
        }
        request.open('GET', url);
        request.send();
    }

    function destroyListener(ref, listener) {
        //ref.removeListener(listener);
    }
