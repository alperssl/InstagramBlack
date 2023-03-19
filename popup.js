
var watchList;

var ghostModeState;

var telegramBotState;

var telegramNotifyState;

function updateTelegramNotifyState(telegramNotify){
    chrome.storage.local.get({'savedSettings': []}, function(data) {
        settings = data.savedSettings;

        if(settings.telegramToken && settings.telegramBotState){
            settings.telegramNotifyState = telegramNotify;

            chrome.storage.local.set({'savedSettings': settings}, function() {
                //console.log("saved.");
                chrome.runtime.sendMessage({command: "updateSettings"}, function(response) {
                    //console.log(response.ok);
                });
            });
        }else{
            alert("You should activate Telegram Bot first to use notifications.");
        }
    });
}


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        if (request.command == "updatePopup"){
            updatePopup();
            sendResponse({resp: "ok"});
            return true;
        }
        if (request.command == "syncList"){
            syncList();
            sendResponse({resp: "ok"});
            return true;
        }

    });



document.getElementById("ghostBtn").addEventListener('click', function() {
    updateGhostMode(!ghostModeState);
});


document.getElementById("telegramIcon").addEventListener('click', function() {
    updateTelegramNotifyState(!telegramNotifyState);
});


document.getElementById("go-to-options").addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options.html'));
    }
});


function syncList(){
    chrome.storage.local.get({'userWatchlist': []}, function(data) {
        watchList = data.userWatchlist;

        var listElements = document.getElementsByTagName("LI");

        for(var i = 0; i < listElements.length; i++)
        {
            listElements[i].parentNode.removeChild(listElements[i]);
        }

        //TODO: what if watchlist not defined yet ? But works so far =) probably I'm not gonna touch

        for (var i = 0; i < watchList.length; i++) {
            var li = document.createElement("li");
            var t = document.createTextNode(watchList[i].username);
            li.appendChild(t);
            document.getElementById("userListUL").appendChild(li);
            li.setAttribute("id", watchList[i].id);
            li.setAttribute('title', "Click to check now.");

            var span = document.createElement("SPAN");
            var txt = document.createTextNode("\u00D7");
            span.className = "close";
            span.setAttribute('title', "Click to remove.");
            span.appendChild(txt);
            li.appendChild(span);

            var close = document.getElementsByClassName("close");
            for (var p = 0; p < close.length; p++) {
                close[p].onclick = function() {
                    var div = this.parentElement;
                    //div.style.display = "none";
                    var closeId = div.getAttribute("id");
                    removeFromWatchlist(closeId);
                    div.parentNode.removeChild(div);
                }
            }
        }
    });
    updatePopup();
}

syncList();

function addUserToList(usernameIn, idIn){

    var newUser = {username:usernameIn, id:idIn};

    chrome.storage.local.get({'userWatchlist': []}, function(data) {
        watchList = data.userWatchlist;

        watchList.push(newUser);

        chrome.storage.local.set({'userWatchlist': watchList}, function() {
            //console.log("done.");
            refreshListOnBack();
        });

    });


}

function removeFromWatchlist(id){

    chrome.storage.local.get({'userWatchlist': []}, function(data) {
        watchList = data.userWatchlist;

        // get index of object with provided id
        var removeIndex = watchList.map(function(item) { return item.id; }).indexOf(id);

        // remove object
        watchList.splice(removeIndex, 1);

        //set new watch list
        chrome.storage.local.set({'userWatchlist': watchList}, function() {
            //console.log("done.");
            refreshListOnBack();
        });

    });

}



function refreshListOnBack(){
    chrome.runtime.sendMessage({command: "updatelist"}, function(response) {
        //console.log(response.ok);
    });
}




// Check when clicking on a list item
var list = document.querySelector('ul');
list.addEventListener('click', function(ev) {
    if (ev.target.tagName === 'LI') {
        var selectedId = ev.target.getAttribute("id");
        chrome.runtime.sendMessage({command: "checkId", id: selectedId}, function(response) {
            //console.log(response.ok);
        });
    }
}, false);



// Add listener for buttons
var addBtn = document.getElementById("addBtn");
addBtn.addEventListener('click', function(ev) {
    newElement();
}, false);

var chkBtn = document.getElementById("chkBtn");
chkBtn.addEventListener('click', function(ev) {

    var inputValue = document.getElementById("usernameInput").value;

    chrome.runtime.sendMessage({command: "check", username: inputValue}, function(response) {
        //console.log(response.ok);
    });

    document.getElementById("usernameInput").value = "";

}, false);



function getIdByUsername(username, callback){
    if(callback){
        var RqstUrl = "https://www.instagram.com/" + username + "/?__a=1";

        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var json = xhr.responseText;                         // Response
            json = json.replace(/^[^(]*\(([\S\s]+)\);?$/, '$1'); // Turn JSONP in JSON
            json = JSON.parse(json);

            if(json.graphql){
                var id = json.graphql.user.id;
                callback(id);
            }else{
                callback("0");
            }


        };
        xhr.open('GET', RqstUrl);
        xhr.send();
    }
}

// Create a new list item when clicking on the "Add" button
function newElement() {       

    var inputValue = document.getElementById("usernameInput").value;

    if (inputValue === '') {
        alert("You must enter username!");
    } else {
        chrome.storage.local.get({'userWatchlist': []}, function(data) {
            watchList = data.userWatchlist;

            if(watchList.find(x => x.username === inputValue)){
                alert("Already on list!");
            }else{
                //check if username valid
                getIdByUsername(inputValue, function(id){
                    if(id != "0"){
                        //let's add to list
                        addUserToList(inputValue, id);

                        var li = document.createElement("li");
                        var t = document.createTextNode(inputValue);
                        li.appendChild(t);
                        document.getElementById("userListUL").appendChild(li);
                        li.setAttribute("id", id);
                        li.setAttribute('title', "Click to check now.");

                        document.getElementById("usernameInput").value = "";

                        var span = document.createElement("SPAN");
                        var txt = document.createTextNode("\u00D7");
                        span.className = "close";
                        span.setAttribute('title', "Click to remove.");
                        span.appendChild(txt);
                        li.appendChild(span);

                        var close = document.getElementsByClassName("close");
                        for (var i = 0; i < close.length; i++) {
                            close[i].onclick = function() {
                                var div = this.parentElement;
                                div.style.display = "none";
                                var closeId = div.getAttribute("id");
                                removeFromWatchlist(closeId);
                                div.parentNode.removeChild(div);
                            }
                        }
                        updatePopup();
                    }else{
                        document.getElementById("usernameInput").value = "";
                        alert("Invalid User!");
                    }
                });
            }
        });
    }
}


function updateGhostMode(ghostmode){
    chrome.storage.local.get({'savedSettings': []}, function(data) {
        settings = data.savedSettings;

        if(settings.interval){

            settings.ghostMode = ghostmode;

            chrome.browserAction.setIcon({ path: ghostmode ? "iconGhost.png" : "icon.png" });

            chrome.storage.local.set({'savedSettings': settings}, function() {
                //console.log("saved.");
                chrome.runtime.sendMessage({command: "updateSettings"}, function(response) {
                    //console.log(response.ok);
                });
            });
        }
    });
}




function updatePopup(){

    var settings;

    chrome.storage.local.get({'savedSettings': []}, function(data) {
        settings = data.savedSettings;

        if(settings.interval){
            var autosaveState = settings.autosaver;
            ghostModeState = settings.ghostMode;
            telegramBotState = settings.telegramBotState;
            telegramNotifyState = settings.telegramNotifyState;

            if(ghostModeState){
                document.getElementById("ghostText").classList.remove("off");
                document.getElementById("ghostBtn").style.color = "limegreen";
            }else{
                document.getElementById("ghostText").classList.add("off");
                document.getElementById("ghostBtn").style.color = "white";
            }


            var telegramIcon = document.getElementById("telegramIcon");

            if(telegramNotifyState){
                telegramIcon.setAttribute('title', "Telegram Notifications Active");
                telegramIcon.style.color = "#0088cc";
            }else{
                telegramIcon.setAttribute('title', "Telegram Notifications Disabled");
                telegramIcon.style.color = "white";
            }


            if(!autosaveState && !telegramNotifyState){
                var element = document.getElementsByTagName("LI");

                for(var i = 0; i < element.length; i++)
                {
                    element[i].classList.add('inactive');
                    element[i].setAttribute('title', "Autosave and Telegram Notification Disabled!");
                }

            }else if(!autosaveState && telegramNotifyState){
                var element = document.getElementsByTagName("LI");

                for(var i = 0; i < element.length; i++)
                {
                    element[i].classList.remove('inactive');
                    element[i].setAttribute('title', "Autosave disabled, but you will get telegram notification.");
                }

            }else if(autosaveState && !telegramNotifyState){
                var element = document.getElementsByTagName("LI");

                for(var i = 0; i < element.length; i++)
                {
                    element[i].classList.remove('inactive');
                    element[i].setAttribute('title', "Telegram notification disabled, but Autosave still active.");
                }

            }else{
                var element = document.getElementsByTagName("LI");

                for(var i = 0; i < element.length; i++)
                {
                    element[i].classList.remove('inactive');
                    element[i].setAttribute('title', "Click to check now. Notification and Autosave active.");
                }
            }



        }
    });

}
updatePopup();
