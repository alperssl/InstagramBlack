var checkInterval = "30";

var ghostModeState = false;

var autosaveState = true;

var watchList;

var targetLasts;

var targetNotifyLasts;

var settings;


//************************************----------TelegramBot-------**************************


var telegramBotState = false;

var telegramNotifyState = false;

var telegramToken = "";

var telegramChatId = "";

var telegramListener;

var isTelegramListenerActive = false;

//in case autosave disabled and notifications disabled
var keybrd1 = {
    "inline_keyboard": [
        [
            {"text": "Enable Autosave", "callback_data": "b1"},
            {"text": "Enable Notifications", "callback_data": "b9"}
        ],
        [
            {"text": "Show Watchlist", "callback_data": "b3"},
            {"text": "Set Check Interval", "callback_data": "b2"}
        ],
        [
            {"text": "One Time Actions", "callback_data": "oneTimeMenu"}
        ],
        [
            {"text": "Close Menu", "callback_data": "b8"}
        ]
    ]
};

//in case autosave enabled and notifications enabled
var keybrd2 = {
    "inline_keyboard": [
        [
            {"text": "Disable Autosave", "callback_data": "b6"},
            {"text": "Disable Notifications", "callback_data": "b10"}
        ],
        [
            {"text": "Show Watchlist", "callback_data": "b3"},
            {"text": "Set Check Interval", "callback_data": "b2"}
        ],
        [
            {"text": "One Time Actions", "callback_data": "oneTimeMenu"}
        ],
        [
            {"text": "Close Menu", "callback_data": "b8"}
        ]
    ]
};

//in case autosave enabled and notifications disabled
var keybrd3 = {
    "inline_keyboard": [
        [
            {"text": "Disable Autosave", "callback_data": "b6"},
            {"text": "Enable Notifications", "callback_data": "b9"}
        ],
        [
            {"text": "Show Watchlist", "callback_data": "b3"},
            {"text": "Set Check Interval", "callback_data": "b2"}
        ],
        [
            {"text": "One Time Actions", "callback_data": "oneTimeMenu"}
        ],
        [
            {"text": "Close Menu", "callback_data": "b8"}
        ]
    ]
};

//in case autosave disabled and notifications enabled
var keybrd4 = {
    "inline_keyboard": [
        [
            {"text": "Enable Autosave", "callback_data": "b1"},
            {"text": "Disable Notifications", "callback_data": "b10"}
        ],
        [
            {"text": "Show Watchlist", "callback_data": "b3"},
            {"text": "Set Check Interval", "callback_data": "b2"}
        ],
        [
            {"text": "One Time Actions", "callback_data": "oneTimeMenu"}
        ],
        [
            {"text": "Close Menu", "callback_data": "b8"}
        ]
    ]
};

//set check interval keyboard
var setIntervalKeybrd = {
    "inline_keyboard": [
        [
            {"text":"« Go Back", "callback_data": "setIntervalBack"}
        ]
    ]
};

//delete deletable message
var deleteKeyboard = {
    "inline_keyboard": [
        [
            {"text":"OK!", "callback_data": "delDeletable"}
        ]
    ]
};


// One time Actions Menu
var oneTimeKeybrd = {
    "inline_keyboard": [
        [
            {"text": "Check by Username", "callback_data": "b5"},
            {"text": "Download by Username", "callback_data": "b7"}
        ],
        [
            {"text": "« Go Back", "callback_data": "goBackOneTimeMenu"}
        ]
    ]
};

// One time Actions Menu - Off List User After Check Query Keyboard
var offListKeybrd = {
    "inline_keyboard": [
        [
            {"text": "Download Them", "callback_data": "getOffList"},
            {"text": "I'm done.", "callback_data": "doneOffList"}
        ]
    ]
};


function menuKeybrdSelector(){
    if(!autosaveState && !telegramNotifyState){
        return keybrd1;
    }else if(autosaveState && telegramNotifyState){
        return keybrd2;
    }else if(autosaveState && !telegramNotifyState){
        return keybrd3;
    }else if(!autosaveState && telegramNotifyState){
        return keybrd4;
    }
}

function makeWatchlistKeyboard(callback){

    var keyboard = {
        "inline_keyboard": []
    };

    chrome.storage.local.get({'userWatchlist': []}, function(data) {
        var tempWatchList = data.userWatchlist;

        for(var i=0; i < tempWatchList.length; i++){
            var btnTxt = tempWatchList[i].username;
            var data = "watchlistUser-" + tempWatchList[i].id;
            var newBtn = [{"text":btnTxt, "callback_data": data}];

            keyboard.inline_keyboard.push(newBtn);
        }

        var newAddBckBtn = [
            {"text": "Add to Watchlist", "callback_data": "b4"},
            {"text":"« Go Back", "callback_data": "watchlistBack"}
        ];
        keyboard.inline_keyboard.push(newAddBckBtn);

        callback(keyboard);
    });
}

function makeCheckWatchlistKeyboard(callback){

    var keyboard = {
        "inline_keyboard": []
    };

    chrome.storage.local.get({'userWatchlist': []}, function(data) {
        var tempWatchList = data.userWatchlist;

        for(var i=0; i < tempWatchList.length; i++){
            var btnTxt = tempWatchList[i].username;
            var data = btnTxt + "+üser+" + tempWatchList[i].id;
            var newBtn = [{"text":btnTxt, "callback_data": data}];

            keyboard.inline_keyboard.push(newBtn);
        }

        var newOnetimeActBtns = [
            {"text": "Check by Username", "callback_data": "b5"},
            {"text": "Download by Username", "callback_data": "b7"}
        ];

        var newOffListUserBtn = [
            {"text": "Check not followed User", "callback_data": "offListUserCheck"}
        ];

        var newOnetimeBckBtn = [
            {"text": "« Go Back", "callback_data": "goBackOneTimeMenu"}
        ];

        keyboard.inline_keyboard.push(newOnetimeActBtns);
        keyboard.inline_keyboard.push(newOffListUserBtn);
        keyboard.inline_keyboard.push(newOnetimeBckBtn);

        callback(keyboard);
    });
}

//********************************************************************************************

function updateSettings(){

    chrome.storage.local.get({'savedSettings': []}, function(data) {
        settings = data.savedSettings;

        if(settings.interval){
            autosaveState = settings.autosaver;
            checkInterval = settings.interval;
            ghostModeState = settings.ghostMode;

            if(settings.telegramBotState){
                telegramBotState = true;
                telegramToken = settings.telegramToken;
                telegramChatId = settings.telegramChatId;
                telegramNotifyState = settings.telegramNotifyState;
                startListenTelegram();

            }else{
                stopListenTelegram();
                telegramBotState = false;
                telegramToken = "";
                telegramChatId = "";
                telegramNotifyState = false;
            }

            if(chrome.extension.getViews({ type: "popup" }).length > 0){
                chrome.runtime.sendMessage({command: "updatePopup"}, function(response) {
                    //console.log("settings and popup updated.");
                });
            }


        }else{
            settings = {autosaver:autosaveState, interval:checkInterval, ghostMode:ghostModeState, telegramBotState:telegramBotState, telegramToken:telegramToken, telegramChatId:telegramChatId, telegramNotifyState:telegramNotifyState}; // default settings
            chrome.storage.local.set({'savedSettings': settings}, function() {
                //console.log("done.");
            });
        }
    });
}
updateSettings();

chrome.webRequest.onBeforeRequest.addListener(
    () => ({
        cancel: ghostModeState
    }),
    { urls: [ '*://*.instagram.com/stories/reel/seen*','*://*.instagram.com/*/*/direct_v2/threads/*/items/*/seen*' ] },
    [ 'blocking' ]
);

//************************************----------TelegramBot-------************************

function updateAutosaveState(state, callback){
    chrome.storage.local.get({'savedSettings': []}, function(data) {
        settings = data.savedSettings;

        if(settings.interval){

            settings.autosaver = state;
            autosaveState = state;

            chrome.storage.local.set({'savedSettings': settings}, function() {
                //console.log("saved.");
                callback();
            });
        }
    });
}

function updateNotifyState(state, callback){
    chrome.storage.local.get({'savedSettings': []}, function(data) {
        settings = data.savedSettings;

        if(settings.interval && settings.telegramBotState){

            settings.telegramNotifyState = state;
            telegramNotifyState = state;

            chrome.storage.local.set({'savedSettings': settings}, function() {
                //console.log("saved.");
                if(chrome.extension.getViews({ type: "popup" }).length > 0){
                    chrome.runtime.sendMessage({command: "updatePopup"}, function(response) {
                        //console.log("popup updated.");
                    });
                }
                if(callback){
                    callback();   
                }
            });
        }
    });
}

function updateCheckInterval(interval, callback){
    chrome.storage.local.get({'savedSettings': []}, function(data) {
        settings = data.savedSettings;

        if(settings.interval){

            settings.interval = interval;
            checkInterval = interval;

            chrome.storage.local.set({'savedSettings': settings}, function() {
                //console.log("saved.");
                if(callback){
                    callback();   
                }
            });
        }
    });
}

function removeFromWatchlist(id, callback){

    chrome.storage.local.get({'userWatchlist': []}, function(data) {
        watchList = data.userWatchlist;

        // get index of object with provided id
        var removeIndex = watchList.map(function(item) { return item.id; }).indexOf(id);

        var usernameOfDeleted = watchList[removeIndex].username;

        // remove object
        watchList.splice(removeIndex, 1);

        //set new watch list
        chrome.storage.local.set({'userWatchlist': watchList}, function() {
            //console.log("done.");
            refreshWatchlist();

            if(chrome.extension.getViews({ type: "popup" }).length > 0){
                chrome.runtime.sendMessage({command: "syncList"}, function(response) {
                    //console.log("popup synchronised.");
                });
            }

            if(callback){
                callback(usernameOfDeleted);
            }
        });
    });
}

function addUserToList(usernameIn, idIn, callback){

    var newUser = {username:usernameIn, id:idIn};

    chrome.storage.local.get({'userWatchlist': []}, function(data) {
        watchList = data.userWatchlist;

        watchList.push(newUser);

        chrome.storage.local.set({'userWatchlist': watchList}, function() {
            //console.log("done.");
            refreshWatchlist();

            if(chrome.extension.getViews({ type: "popup" }).length > 0){
                chrome.runtime.sendMessage({command: "syncList"}, function(response) {
                    //console.log("popup synchronised.");
                });
            }

            if(callback){
                callback();
            }
        });
    });
}

function telegramSendMessage(message, callback){

    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var json = xhr.responseText;                         // Response
        json = JSON.parse(json);
        if(callback){
            callback(json.result.message_id);
        }
    };
    xhr.open("POST", 'https://api.telegram.org/bot' + telegramToken + '/sendMessage', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        chat_id:telegramChatId,
        text:message,
        parse_mode:"html"
    }));
}

function telegramDeleteMessage(messageId){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://api.telegram.org/bot' + telegramToken + '/deleteMessage', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        chat_id:telegramChatId,
        message_id:messageId
    }));
}

function telegramEditMessageMarkup(messageId, markup){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://api.telegram.org/bot' + telegramToken + '/editMessageReplyMarkup', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        chat_id:telegramChatId,
        message_id:messageId,
        reply_markup:markup
    }));
}
function telegramEditMessageTextMarkup(messageId, text, markup){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://api.telegram.org/bot' + telegramToken + '/editMessageText', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        chat_id:telegramChatId,
        message_id:messageId,
        parse_mode:"html",
        text:text,
        reply_markup:markup
    }));
}

function telegramAnswer(queryId, text, showAlert){

    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://api.telegram.org/bot' + telegramToken + '/answerCallbackQuery', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        callback_query_id:queryId,
        text:text,
        show_alert:showAlert
    }));
}

function telegramSendInline(message, keybrd, callback){

    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var json = xhr.responseText;                         // Response
        json = JSON.parse(json);
        if(callback){
            callback(json.result.message_id);
        }
    };

    xhr.open("POST", 'https://api.telegram.org/bot' + telegramToken + '/sendMessage', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        chat_id:telegramChatId,
        text:message,
        parse_mode:"html",
        reply_markup:keybrd
    }));
}

function timestampToDate(timestamp){

    var ts_ms = timestamp * 1000;
    var date_ob = new Date(ts_ms);
    var year = date_ob.getFullYear();
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var date = ("0" + date_ob.getDate()).slice(-2);
    var hours = ("0" + date_ob.getHours()).slice(-2);
    var minutes = ("0" + date_ob.getMinutes()).slice(-2);
    var seconds = ("0" + date_ob.getSeconds()).slice(-2);

    var dateString = date + "/" + month + "/" + year + "  " + hours + ":" + minutes + ":" + seconds;

    return dateString;
}

function sendNotification(link, username, timestamp) {
    var date = timestampToDate(timestamp);

    var message = "<b>" + username + "</b> shared <a href='" + link + "'>this</a> story on " + date;

    telegramSendMessage(message);
}


function startListenTelegram(){

    if(!isTelegramListenerActive){

        var offset = 0;

        var menuMessageId = 0;
        var menuKeybrd;
        var invalidEnterMesId = 0;
        var succsessMesId = 0;

        var waitForIntervalReply = false;

        var expectUsername = false;
        var gotUsername = 0;
        var lastGotUsernameMesId = 0;
        var gotUsernameTxt = "";

        var delCheckMesId = "0";

        var xhr = new XMLHttpRequest();

        xhr.onload = function() {
            var json = xhr.responseText;                         // Response
            json = JSON.parse(json);
            var result = json.result;

            if(result){
                for(var i=0; i < result.length; i++){

                    var updateId = result[i].update_id;

                    offset = parseInt(updateId) + 1;

                    if(result[i].message){
                        if(result[i].message.from.id == telegramChatId){

                            if(result[i].message.text == "menu" || result[i].message.text == "/menu" || result[i].message.text == "Menu"){

                                waitForIntervalReply = false;
                                expectUsername = false;
                                gotUsername = 0;
                                gotUsernameTxt = "";

                                if(invalidEnterMesId != 0){
                                    telegramDeleteMessage(invalidEnterMesId);
                                    invalidEnterMesId = 0;
                                }
                                if(succsessMesId != 0){
                                    telegramDeleteMessage(succsessMesId);
                                    succsessMesId = 0;
                                }
                                if(lastGotUsernameMesId != 0){
                                    telegramDeleteMessage(lastGotUsernameMesId);
                                    lastGotUsernameMesId = 0;
                                }

                                if(menuMessageId == 0){
                                    telegramDeleteMessage(result[i].message.message_id);
                                    var ms = "<b>Insatagram Black Menu</b>" ;
                                    menuKeybrd = menuKeybrdSelector();
                                    telegramSendInline(ms, menuKeybrd, function(messId){
                                        menuMessageId = messId;
                                    });
                                }else{
                                    telegramDeleteMessage(menuMessageId);
                                    menuMessageId = 0;
                                    telegramDeleteMessage(result[i].message.message_id);
                                    var ms = "<b>Insatagram Black Menu</b>" ;
                                    menuKeybrd = menuKeybrdSelector();
                                    telegramSendInline(ms, menuKeybrd, function(messId){
                                        menuMessageId = messId;
                                    });
                                }


                            }else if(waitForIntervalReply){
                                var mesTxt = result[i].message.text;

                                var asInt = parseInt(mesTxt);

                                if(asInt <= 3600 && asInt >= 10){
                                    telegramDeleteMessage(result[i].message.message_id);
                                    if(invalidEnterMesId != 0){
                                        telegramDeleteMessage(invalidEnterMesId);
                                        invalidEnterMesId = 0;
                                    }
                                    if(succsessMesId != 0){
                                        telegramDeleteMessage(succsessMesId);
                                        succsessMesId = 0;
                                    }

                                    var succsessMes = "Check Interval set to: " + mesTxt;

                                    updateCheckInterval(mesTxt, function(){
                                        telegramSendMessage(succsessMes,function(sentMesId){
                                            succsessMesId = sentMesId;
                                            var intervalMenuRefMessage = "<b>Insatagram Black Menu</b>\nCurrent interval: <b>" + checkInterval + "</b>\nEnter interval in seconds 10-3600:";
                                            telegramEditMessageTextMarkup(menuMessageId, intervalMenuRefMessage, setIntervalKeybrd);
                                        });
                                    });

                                }else{
                                    telegramDeleteMessage(result[i].message.message_id);
                                    if(succsessMesId != 0){
                                        telegramDeleteMessage(succsessMesId);
                                        succsessMesId = 0;
                                    }
                                    if(invalidEnterMesId == 0){
                                        telegramSendMessage("invalid enter please type numbers between 10-3600",function(sentMesId){
                                            invalidEnterMesId = sentMesId;
                                        });
                                    }
                                }

                            }else if(expectUsername){
                                gotUsernameTxt = result[i].message.text;
                                gotUsername++;

                                if(gotUsername == 2){
                                    telegramDeleteMessage(lastGotUsernameMesId);
                                    gotUsername--;
                                }

                                lastGotUsernameMesId = result[i].message.message_id;

                            }else{
                                if(menuMessageId != 0){
                                    telegramDeleteMessage(result[i].message.message_id);
                                }
                            }

                        }
                    }else if(result[i].callback_query){
                        if(result[i].callback_query.from.id == telegramChatId){

                            var callback_query = result[i].callback_query;

                            waitForIntervalReply = false;

                            switch(callback_query.data) {
                                case "b1": // Enable Autosave Button
                                    if(!autosaveState){
                                        updateAutosaveState(true,function(){
                                            telegramAnswer(callback_query.id, "Autosave Enabled", false);
                                            menuKeybrd = menuKeybrdSelector();
                                            telegramEditMessageMarkup(menuMessageId, menuKeybrd);
                                        });
                                    }else{
                                        telegramAnswer(callback_query.id, "Autosave Enabled Allready", false);
                                        menuKeybrd = menuKeybrdSelector();
                                        telegramEditMessageMarkup(menuMessageId, menuKeybrd);
                                    }
                                    break;

                                case "b6": // Disable Autosave Button
                                    if(autosaveState){
                                        updateAutosaveState(false,function(){
                                            telegramAnswer(callback_query.id, "Autosave Disabled", false);
                                            menuKeybrd = menuKeybrdSelector();
                                            telegramEditMessageMarkup(menuMessageId, menuKeybrd);
                                        });
                                    }else{
                                        telegramAnswer(callback_query.id, "Autosave Disabled Allready", false);
                                        menuKeybrd = menuKeybrdSelector();
                                        telegramEditMessageMarkup(menuMessageId, menuKeybrd);
                                    }
                                    break;

                                case "b9": // Enable Notifications
                                    if(!telegramNotifyState){
                                        updateNotifyState(true,function(){
                                            telegramAnswer(callback_query.id, "Notifications Enabled", false);
                                            menuKeybrd = menuKeybrdSelector();
                                            telegramEditMessageMarkup(menuMessageId, menuKeybrd);
                                        });
                                    }else{
                                        telegramAnswer(callback_query.id, "Notifications Enabled Allready", false);
                                        menuKeybrd = menuKeybrdSelector();
                                        telegramEditMessageMarkup(menuMessageId, menuKeybrd);
                                    }
                                    break;

                                case "b10": // Disable Notifications
                                    if(telegramNotifyState){
                                        updateNotifyState(false,function(){
                                            telegramAnswer(callback_query.id, "Notifications Disabled", false);
                                            menuKeybrd = menuKeybrdSelector();
                                            telegramEditMessageMarkup(menuMessageId, menuKeybrd);
                                        });
                                    }else{
                                        telegramAnswer(callback_query.id, "Notifications Disabled Allready", false);
                                        menuKeybrd = menuKeybrdSelector();
                                        telegramEditMessageMarkup(menuMessageId, menuKeybrd);
                                    }
                                    break;

                                case "b2": // Set Check Interval Button
                                    telegramAnswer(callback_query.id, "", false);
                                    var intervalMenuMessage = "<b>Insatagram Black Menu</b>\nCurrent interval: <b>" + checkInterval + "</b>\nEnter interval in seconds 10-3600:";
                                    telegramEditMessageTextMarkup(menuMessageId, intervalMenuMessage, setIntervalKeybrd);
                                    waitForIntervalReply = true;
                                    break;

                                case "setIntervalBack": // Go back from set check interval
                                    if(invalidEnterMesId != 0){
                                        telegramDeleteMessage(invalidEnterMesId);
                                    }
                                    if(succsessMesId != 0){
                                        telegramDeleteMessage(succsessMesId);
                                    }
                                    menuKeybrd = menuKeybrdSelector();
                                    telegramEditMessageTextMarkup(menuMessageId, "<b>Insatagram Black Menu</b>", menuKeybrd);
                                    waitForIntervalReply = false;
                                    telegramAnswer(callback_query.id, "", false);
                                    break;

                                case "b3": // Show Watchlist Button
                                    makeWatchlistKeyboard(function(listKeybrd){
                                        var menuTxt = "<b>Insatagram Black Menu</b>\n\n<b>Watchlist</b>\n\nTouch username to remove from list.\n\nSend username you want to add and touch add to watchlist.";

                                        telegramEditMessageTextMarkup(menuMessageId, menuTxt, listKeybrd);
                                        expectUsername = true;
                                        telegramAnswer(callback_query.id, "", false);
                                    });
                                    break;

                                case "watchlistBack": // Go Back from Watchlist
                                    if(gotUsername==0){
                                        expectUsername = false;
                                        lastGotUsernameMesId = 0;
                                        gotUsernameTxt = "";
                                        menuKeybrd = menuKeybrdSelector();
                                        telegramEditMessageTextMarkup(menuMessageId, "<b>Insatagram Black Menu</b>", menuKeybrd);
                                        telegramAnswer(callback_query.id, "", false);
                                    }else{
                                        expectUsername = false;
                                        gotUsername = 0;
                                        telegramDeleteMessage(lastGotUsernameMesId);
                                        lastGotUsernameMesId = 0;
                                        gotUsernameTxt = "";

                                        menuKeybrd = menuKeybrdSelector();
                                        telegramEditMessageTextMarkup(menuMessageId, "<b>Insatagram Black Menu</b>", menuKeybrd);
                                        telegramAnswer(callback_query.id, "", false);
                                    }
                                    break;

                                case "b4": // Add to Watchlist Button
                                    if(gotUsername == 0){
                                        telegramAnswer(callback_query.id, "Send username first.", true);
                                    }else{
                                        if(watchList.find(x => x.username === gotUsernameTxt)){
                                            telegramDeleteMessage(lastGotUsernameMesId);
                                            gotUsername--;
                                            telegramAnswer(callback_query.id, "Username allready on list!", true);
                                        }else{
                                            getIdByUsername(gotUsernameTxt, function(id){
                                                if(id != "0"){

                                                    addUserToList(gotUsernameTxt, id, function(){
                                                        telegramDeleteMessage(lastGotUsernameMesId);
                                                        gotUsername--;
                                                        makeWatchlistKeyboard(function(listKeybrd){
                                                            telegramEditMessageMarkup(menuMessageId, listKeybrd);
                                                            var addedMes = gotUsernameTxt + " added to Watchlist";
                                                            telegramAnswer(callback_query.id, addedMes, false);
                                                        });
                                                    });
                                                }else{
                                                    telegramDeleteMessage(lastGotUsernameMesId);
                                                    gotUsername--;
                                                    telegramAnswer(callback_query.id, "Username invalid!", true);
                                                }
                                            });
                                        }
                                    }
                                    break;

                                case "oneTimeMenu": // Open One Time Actions Menu

                                    var onetimeMenuTxt = "<b>Insatagram Black Menu</b>\n\n<b>One Time Actions</b>\n\nSend username and touch what you want to do. Or just touch to username to check inline.";

                                    makeCheckWatchlistKeyboard(function(listKeybrd){
                                        telegramEditMessageTextMarkup(menuMessageId, onetimeMenuTxt, listKeybrd);
                                        expectUsername = true;
                                        telegramAnswer(callback_query.id, "", false);
                                    });

                                    break;

                                case "goBackOneTimeMenu": // Go Back from One Time Actions Menu

                                    if(gotUsername==0){
                                        expectUsername = false;
                                        lastGotUsernameMesId = 0;
                                        gotUsernameTxt = "";
                                        menuKeybrd = menuKeybrdSelector();
                                        telegramEditMessageTextMarkup(menuMessageId, "<b>Insatagram Black Menu</b>", menuKeybrd);
                                        telegramAnswer(callback_query.id, "", false);
                                    }else{
                                        expectUsername = false;
                                        gotUsername = 0;
                                        telegramDeleteMessage(lastGotUsernameMesId);
                                        lastGotUsernameMesId = 0;
                                        gotUsernameTxt = "";

                                        menuKeybrd = menuKeybrdSelector();
                                        telegramEditMessageTextMarkup(menuMessageId, "<b>Insatagram Black Menu</b>", menuKeybrd);
                                        telegramAnswer(callback_query.id, "", false);
                                    }

                                    break;

                                case "b5": // Check by Username Button
                                    if(gotUsername == 0){
                                        telegramAnswer(callback_query.id, "Send username first.", true);
                                    }else{
                                        getIdByUsername(gotUsernameTxt, function(id){
                                            if(id != "0"){
                                                telegramDeleteMessage(lastGotUsernameMesId);
                                                gotUsername--;

                                                check(id,true,false,true,true,false,function(state){
                                                    switch(state){
                                                        case "nothing":
                                                            telegramAnswer(callback_query.id, "User don't have stories.", true);
                                                            break;
                                                        case "gotAll":
                                                            var onetimeMenuTxtN = "<b>Insatagram Black Menu</b>\n\n<b>One Time Actions</b>\n\nSend username and touch what you want to do.";

                                                            telegramDeleteMessage(menuMessageId);
                                                            menuMessageId = 0;

                                                            makeCheckWatchlistKeyboard(function(listKeybrd){
                                                                telegramSendInline(onetimeMenuTxtN, listKeybrd, function(messId){
                                                                    menuMessageId = messId;
                                                                });
                                                            });

                                                            telegramAnswer(callback_query.id, "We got all.", true);
                                                            break;
                                                        default:
                                                            telegramAnswer(callback_query.id, "", false);
                                                    }
                                                });

                                            }else{
                                                telegramDeleteMessage(lastGotUsernameMesId);
                                                gotUsername--;
                                                telegramAnswer(callback_query.id, "Username invalid!", true);
                                            }
                                        });
                                    }
                                    break;

                                case "b7": // Download by Username
                                    if(gotUsername == 0){
                                        telegramAnswer(callback_query.id, "Send username first.", true);
                                    }else{
                                        getIdByUsername(gotUsernameTxt, function(id){
                                            if(id != "0"){
                                                telegramDeleteMessage(lastGotUsernameMesId);
                                                gotUsername--;


                                                check(id,true,true,true,false,false,function(state){
                                                    switch(state){
                                                        case "nothing":
                                                            telegramAnswer(callback_query.id, "User don't have stories.", true);
                                                            break;
                                                        case "gotAll":
                                                            var onetimeMenuTxtN = "<b>Insatagram Black Menu</b>\n\n<b>One Time Actions</b>\n\nSend username and touch what you want to do.";

                                                            telegramDeleteMessage(menuMessageId);
                                                            menuMessageId = 0;

                                                            makeCheckWatchlistKeyboard(function(listKeybrd){
                                                                telegramSendInline(onetimeMenuTxtN, listKeybrd, function(messId){
                                                                    menuMessageId = messId;
                                                                });
                                                            });

                                                            telegramAnswer(callback_query.id, "We got all.", true);
                                                            break;
                                                        case "haveThem":
                                                            telegramAnswer(callback_query.id, "Allready have this users stories.", true);
                                                            break;
                                                        default:
                                                            telegramAnswer(callback_query.id, "", false);
                                                    }
                                                });

                                            }else{
                                                telegramDeleteMessage(lastGotUsernameMesId);
                                                gotUsername--;
                                                telegramAnswer(callback_query.id, "Username invalid!", true);
                                            }
                                        });
                                    }
                                    break;

                                case "offListUserCheck": // Check someone not followed
                                    if(gotUsername == 0){
                                        telegramAnswer(callback_query.id, "Send username first.", true);
                                    }else{
                                        getIdByUsername(gotUsernameTxt, function(id){
                                            if(id != "0"){
                                                telegramDeleteMessage(lastGotUsernameMesId);
                                                gotUsername--;
                                                check(id,true,false,true,true,true,function(state){
                                                    switch(state){
                                                        case "nothing":
                                                            telegramAnswer(callback_query.id, "User don't have stories.", true);
                                                            break;
                                                        case "gotAll":
                                                            telegramSendInline("We got all.", offListKeybrd, function(messId){
                                                                delCheckMesId = messId;
                                                            });

                                                            telegramAnswer(callback_query.id, "We got all. Do u want me to download them ?", true);
                                                            break;
                                                        default:
                                                            telegramAnswer(callback_query.id, "", false);
                                                    }
                                                });

                                            }else{
                                                telegramDeleteMessage(lastGotUsernameMesId);
                                                gotUsername--;
                                                telegramAnswer(callback_query.id, "Username invalid!", true);
                                            }
                                        });
                                    }
                                    break;

                                case "doneOffList": // done with off list user
                                    if(delCheckMesId != "0"){
                                        telegramDeleteMessage(delCheckMesId);
                                        delCheckMesId = "0";
                                    }

                                    var onetimeMenuTxtN = "<b>Insatagram Black Menu</b>\n\n<b>One Time Actions</b>\n\nSend username and touch what you want to do.";

                                    telegramDeleteMessage(menuMessageId);
                                    menuMessageId = 0;

                                    makeCheckWatchlistKeyboard(function(listKeybrd){
                                        telegramSendInline(onetimeMenuTxtN, listKeybrd, function(messId){
                                            menuMessageId = messId;
                                        });
                                    });

                                    telegramAnswer(callback_query.id, "", false);
                                    break;

                                case "getOffList": // download off list user stories if not exist on server

                                    getIdByUsername(gotUsernameTxt, function(id){
                                        if(id != "0"){
                                            check(id,true,true,false,false,true,function(state){

                                                if(delCheckMesId != "0"){
                                                    telegramDeleteMessage(delCheckMesId);
                                                    delCheckMesId = "0";
                                                }

                                                var onetimeMenuTxtN = "<b>Insatagram Black Menu</b>\n\n<b>One Time Actions</b>\n\nSend username and touch what you want to do.";

                                                telegramDeleteMessage(menuMessageId);
                                                menuMessageId = 0;

                                                makeCheckWatchlistKeyboard(function(listKeybrd){
                                                    telegramSendInline(onetimeMenuTxtN, listKeybrd, function(messId){
                                                        menuMessageId = messId;
                                                    });
                                                });

                                                switch(state){
                                                    case "nothing":
                                                        telegramAnswer(callback_query.id, "Opps!", true);
                                                        break;
                                                    case "gotAll":
                                                        telegramAnswer(callback_query.id, "Downloaded all to server.", true);
                                                        break;
                                                    case "haveThem":
                                                        telegramAnswer(callback_query.id, "Allready have this users stories.", true);
                                                        break;
                                                    default:
                                                        telegramAnswer(callback_query.id, "", false);
                                                }

                                            });

                                        }else{
                                            telegramAnswer(callback_query.id, "Opps!", true);
                                        }
                                    });                                    
                                    break;

                                case "b8": // Close Menu
                                    telegramAnswer(callback_query.id, "", false);
                                    telegramDeleteMessage(menuMessageId);
                                    menuMessageId = 0;
                                    break;

                                case "delDeletable": // delete deletable message if exist
                                    if(delCheckMesId != "0"){
                                        telegramDeleteMessage(delCheckMesId);
                                        delCheckMesId = "0";
                                        telegramAnswer(callback_query.id, "", false);
                                    }else{
                                        telegramAnswer(callback_query.id, "", false);
                                    }
                                    break;

                                default:
                                    if(callback_query.data.indexOf("watchlistUser-") == 0){
                                        var idToDelete = (callback_query.data).slice(14);
                                        removeFromWatchlist(idToDelete, function(usrname){
                                            makeWatchlistKeyboard(function(listKeybrd){
                                                telegramEditMessageMarkup(menuMessageId, listKeybrd);
                                                var deleteMs = usrname + "removed from list.";
                                                telegramAnswer(callback_query.id, deleteMs, false);
                                            });
                                        });
                                    }
                                    if(callback_query.data.indexOf("+üser+") != -1){
                                        var usernameAndId = callback_query.data;

                                        let n = usernameAndId.indexOf("+üser+");
                                        var usernameToSend = usernameAndId.slice(0, n);
                                        var idToCheck = usernameAndId.slice(n+6);

                                        check(idToCheck, true, false, false, true, false, function(got){
                                            if(got == "nothing"){
                                                telegramAnswer(callback_query.id, "User don't have any story.", true);
                                            }else if(got == "opps"){
                                                telegramAnswer(callback_query.id, "Opps!", true);
                                            }else{

                                                var deletableMes = "<b>" + usernameToSend + "</b> shared";

                                                for(let v = 0; v < got.length; v++){

                                                    if(got[v].is_video == true){
                                                        //video
                                                        let timeStamp = got[v].taken_at_timestamp;
                                                        let timeStampTxt = timestampToDate(timeStamp);
                                                        let videoRes = got[v].video_resources;
                                                        let fileURL = videoRes[videoRes.length-1].src;

                                                        let newStoryTxt = "\n<a href='" + fileURL + "'>this</a> story on " + timeStampTxt;
                                                        deletableMes = deletableMes.concat(newStoryTxt);

                                                    }else{
                                                        //photo
                                                        let timeStamp = got[v].taken_at_timestamp;
                                                        let timeStampTxt = timestampToDate(timeStamp);
                                                        let photoRes = got[v].display_resources;
                                                        let fileURL = photoRes[photoRes.length-1].src;

                                                        let newStoryTxt = "\n<a href='" + fileURL + "'>this</a> story on " + timeStampTxt;
                                                        deletableMes = deletableMes.concat(newStoryTxt);
                                                    }
                                                }

                                                if(delCheckMesId != "0"){
                                                    telegramDeleteMessage(delCheckMesId);
                                                    delCheckMesId = "0";
                                                }
                                                telegramSendInline(deletableMes,deleteKeyboard,function(deletableMesId){
                                                    delCheckMesId = deletableMesId;
                                                    telegramAnswer(callback_query.id, "", false);
                                                });
                                            }
                                        });
                                    }
                            }

                        }else{
                            //do nothing just delete by increasing offset
                        }
                    }
                }
            }
        };

        telegramListener = setInterval(function(){
            xhr.open("POST", 'https://api.telegram.org/bot' + telegramToken + '/getUpdates', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
                offset:offset
            }));
        }, 1000);

        isTelegramListenerActive = true;
    }
}

function stopListenTelegram(){
    clearInterval(telegramListener);
    isTelegramListenerActive = false;
}


//****************************************************************************************


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        if (request.command == "updateSettings"){
            updateSettings();
            sendResponse({resp: "ok"});
            return true;
        }
        if (request.command == "updatelist"){
            refreshWatchlist();
            sendResponse({resp: "ok"});
            return true;
        }
        if (request.command == "check"){
            getIdByUsername(request.username, function(id){
                if(id != "0"){
                    check(id, false, true, false, false, false);
                }else{
                    alert("Invalid User!");
                }
                sendResponse({resp: "ok"});
            });
            return true;
        }
        if (request.command == "checkId"){
            check(request.id, false, true, telegramNotifyState, false, false);
            sendResponse({resp: "ok"});
            return true;
        }

    });




//refresh watchlist
function refreshWatchlist(){

    var oldWList = watchList;

    chrome.storage.local.get({'userWatchlist': []}, function(data) {
        watchList = data.userWatchlist;

        if(watchList != oldWList){
            autoCheck();
        }
    });   
}
refreshWatchlist();






// Automated Check Function **********************
function autoCheck(){
    if(autosaveState || telegramNotifyState){  // only if enabled
        if(watchList && watchList.length > 0){
            //console.log('autosave Called');
            for (var i = 0; i < watchList.length; i++) {
                if(telegramNotifyState && !autosaveState){
                    check(watchList[i].id, true, false, true, false, false);
                }else if(!telegramNotifyState && autosaveState){
                    check(watchList[i].id, true, true, false, false, false);
                }else if(telegramNotifyState && autosaveState){
                    check(watchList[i].id, true, true, true, false, false);
                }
            }       
        }
    }
}

autoCheck();

setInterval(function(){
    autoCheck();
}, (parseInt(checkInterval)*1000));

//***********************************************





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



function getLastAutosaveById(userId, callback) {
    chrome.storage.local.get({'targetLasts': []}, function(data) {
        targetLasts = data.targetLasts;

        if(targetLasts.find(x => x.id === userId)){
            var index = targetLasts.findIndex(x => x.id === userId);
            //console.log(targetLasts[index].last);
            callback(targetLasts[index].last);
        }else{
            var newUserLast = {id:userId, last:"0"};
            targetLasts.push(newUserLast);
            chrome.storage.local.set({'targetLasts': targetLasts}, function() {
                //console.log("set done.");
                callback("0");
            });
        }
    });
}
function getLastNotifyById(userId, callback) {
    chrome.storage.local.get({'targetNotifyLasts': []}, function(data) {
        targetNotifyLasts = data.targetNotifyLasts;

        if(targetNotifyLasts.find(x => x.id === userId)){
            var index = targetNotifyLasts.findIndex(x => x.id === userId);
            //console.log(targetLasts[index].last);
            callback(targetNotifyLasts[index].last);
        }else{
            var newUserLast = {id:userId, last:"0"};
            targetNotifyLasts.push(newUserLast);
            chrome.storage.local.set({'targetNotifyLasts': targetNotifyLasts}, function() {
                //console.log("set done.");
                callback("0");
            });
        }
    });
}
function getLastById(userId, callback) {
    getLastAutosaveById(userId, function(lastAutosave){
        var tmpLastAutosave = lastAutosave;
        getLastNotifyById(userId, function(lastNotify){
            callback(tmpLastAutosave, lastNotify);
        });
    });
}



function setLastAutosaveById(userId, last) {
    chrome.storage.local.get({'targetLasts': []}, function(data) {
        targetLasts = data.targetLasts;

        if(targetLasts.find(x => x.id === userId)){
            var index = targetLasts.findIndex(x => x.id === userId);
            targetLasts[index].last = last.toString();

            chrome.storage.local.set({'targetLasts': targetLasts}, function() {
                //console.log("set done.");
            });
        }else{
            var newUserLast = {id:userId, last:last.toString()};
            targetLasts.push(newUserLast);
            chrome.storage.local.set({'targetLasts': targetLasts}, function() {
                //console.log("set done.");
            });
        }
    });
}
function setLastNotifyById(userId, last) {
    chrome.storage.local.get({'targetNotifyLasts': []}, function(data) {
        targetNotifyLasts = data.targetNotifyLasts;

        if(targetNotifyLasts.find(x => x.id === userId)){
            var index = targetNotifyLasts.findIndex(x => x.id === userId);
            targetNotifyLasts[index].last = last.toString();

            chrome.storage.local.set({'targetNotifyLasts': targetNotifyLasts}, function() {
                //console.log("set done.");
            });

        }else{
            var newUserLast = {id:userId, last:last.toString()};
            targetNotifyLasts.push(newUserLast);
            chrome.storage.local.set({'targetNotifyLasts': targetNotifyLasts}, function() {
                //console.log("set done.");
            });
        }
    });
}
function setLastById(userId, lastAutosave, lastNotify) {
    setLastAutosaveById(userId, lastAutosave);
    setLastNotifyById(userId, lastNotify);
}



function check(targetId, isSilent, isDownload, notify, unSaved = false, offList = false, callback){
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var json = xhr.responseText;                         // Response
        json = json.replace(/^[^(]*\(([\S\s]+)\);?$/, '$1'); // Turn JSONP in JSON
        try {
            json = JSON.parse(json);
        }
        catch(err) {
            console.log(err.message);
            return;
        }

        if(!offList){
            var allStories = json.data.user.feed_reels_tray.edge_reels_tray_to_reel.edges;

            var storiesOfTarget = null;

            for(var x in allStories){
                if(allStories[x].node.id == targetId){
                    storiesOfTarget = allStories[x];
                }
            }               
        }else{
            var storiesOfTarget = json.data.reels_media[0];
        }
        // we got stories of target

        if(storiesOfTarget == null){               // but there is no stories
            if(!isSilent){
                alert("Nothing shared!");
            }
            if(callback){
                callback("nothing");
            }
        }else{                                     // there are stories but we have to check if we have them allready
            getLastById(targetId, function(lastAutosave, lastNotify) {
                //we downloaded lastly 'lastAutosave'
                //we notify lastly 'lastNotify'

                if(unSaved){ // unsaved request only can be notified. To avoid redownload.
                    lastNotify = "0";
                }

                //check if last story of target downloaded
                if(offList){
                    var lastOnTarget = json.data.reels_media[0].latest_reel_media;
                }else{
                    var lastOnTarget = storiesOfTarget.node.latest_reel_media;    
                }
                //console.log(storiesOfTarget.node.latest_reel_media);

                if(lastOnTarget > parseInt(lastAutosave) || (lastOnTarget > parseInt(lastNotify) && !(offList && isDownload))){
                    //there is news
                    //console.log("Second JSON request sent");
                    //save them

                    var xhr2 = new XMLHttpRequest();
                    xhr2.onload = function() {
                        var json2 = xhr2.responseText;                         // Response
                        json2 = json2.replace(/^[^(]*\(([\S\s]+)\);?$/, '$1'); // Turn JSONP in JSON
                        try {
                            json2 = JSON.parse(json2);
                        }
                        catch(err) {
                            if(callback && !isDownload && !notify && unSaved){
                                callback("opps");
                            }else{
                                console.log(err.message);
                                return;
                            }
                        }


                        // we got all we need which what is on tagets story circle
                        //console.log(json2);

                        var storyDataOfTarget = json2.data.reels_media[0].items; // all stories curently in circle

                        if(callback && !isDownload && !notify && unSaved){
                            callback(storyDataOfTarget);
                        }

                        var storyCountOnCircle = json2.data.reels_media[0].items.length;
                        lastOnTarget = json2.data.reels_media[0].latest_reel_media;
                        var targetUsername = json2.data.reels_media[0].owner.username;

                        var lastAutosaveOnCircle = -1;
                        var lastNotifyOnCircle = -1;

                        for(var x in storyDataOfTarget){
                            if(storyDataOfTarget[x].taken_at_timestamp == lastAutosave){
                                lastAutosaveOnCircle = x;
                            }
                            if(storyDataOfTarget[x].taken_at_timestamp == lastNotify){
                                lastNotifyOnCircle = x;
                            }
                        }

                        var autosaveCondition = lastAutosaveOnCircle == -1;
                        var notifyCondition = lastNotifyOnCircle == -1;

                        if(autosaveCondition || notifyCondition){  // if we dont have any of circle stories, start saving from 0
                            //console.log("we dont have any of circle stories");

                            for(let x in storyDataOfTarget){
                                if(storyDataOfTarget[x].is_video == true){
                                    //save as video
                                    let fileName = storyDataOfTarget[x].taken_at_timestamp;
                                    let videoRes = storyDataOfTarget[x].video_resources;
                                    let fileURL = videoRes[videoRes.length-1].src;

                                    if(isDownload && autosaveCondition){
                                        chrome.downloads.download({
                                            url: fileURL,
                                            filename: "autosavedstories/" + targetUsername + "/" + targetUsername + "_" + fileName + ".mp4"
                                        });
                                    }
                                    if(notify && notifyCondition){
                                        sendNotification(fileURL, targetUsername, fileName);
                                    }

                                }else{
                                    //save as photo
                                    let fileName = storyDataOfTarget[x].taken_at_timestamp;
                                    let photoRes = storyDataOfTarget[x].display_resources;
                                    let fileURL = photoRes[photoRes.length-1].src;

                                    if(isDownload && autosaveCondition){
                                        chrome.downloads.download({
                                            url: fileURL,
                                            filename: "autosavedstories/" + targetUsername + "/" + targetUsername + "_" + fileName + ".jpg"
                                        });   
                                    }

                                    if(notify && notifyCondition){
                                        sendNotification(fileURL, targetUsername, fileName);
                                    }
                                }
                            }

                        }
                        if(!autosaveCondition){ // if we have some allready then start from where we stay
                            //console.log("last we have on circle: " + lastWeHaveOnCircle);
                            //console.log(storyCountOnCircle);

                            let xyz = parseInt(lastAutosaveOnCircle) + 1;

                            for(let x = xyz; x < storyCountOnCircle; x++){
                                if(storyDataOfTarget[x].is_video == true){
                                    //save as video
                                    let fileName = storyDataOfTarget[x].taken_at_timestamp;
                                    let videoRes = storyDataOfTarget[x].video_resources;
                                    let fileURL = videoRes[videoRes.length-1].src;

                                    if(isDownload){
                                        chrome.downloads.download({
                                            url: fileURL,
                                            filename: "autosavedstories/" + targetUsername + "/" + targetUsername + "_" + fileName + ".mp4"
                                        });
                                    }
                                }else{
                                    //save as photo
                                    let fileName = storyDataOfTarget[x].taken_at_timestamp;
                                    let photoRes = storyDataOfTarget[x].display_resources;
                                    let fileURL = photoRes[photoRes.length-1].src;

                                    if(isDownload){
                                        chrome.downloads.download({
                                            url: fileURL,
                                            filename: "autosavedstories/" + targetUsername + "/" + targetUsername + "_" + fileName + ".jpg"
                                        });
                                    }
                                }
                            }
                        }

                        if(!notifyCondition){
                            let xyz = parseInt(lastNotifyOnCircle) + 1;

                            for(let x = xyz; x < storyCountOnCircle; x++){
                                if(storyDataOfTarget[x].is_video == true){
                                    //save as video
                                    let fileName = storyDataOfTarget[x].taken_at_timestamp;
                                    let videoRes = storyDataOfTarget[x].video_resources;
                                    let fileURL = videoRes[videoRes.length-1].src;

                                    if(notify){
                                        sendNotification(fileURL, targetUsername, fileName);
                                    }
                                }else{
                                    //save as photo
                                    let fileName = storyDataOfTarget[x].taken_at_timestamp;
                                    let photoRes = storyDataOfTarget[x].display_resources;
                                    let fileURL = photoRes[photoRes.length-1].src;

                                    if(notify){
                                        sendNotification(fileURL, targetUsername, fileName);
                                    }
                                }
                            }
                        }


                        //after save, set last of target
                        if(!unSaved){
                            if(isDownload){
                                setLastAutosaveById(targetId, lastOnTarget);
                            }
                            if(notify){
                                setLastNotifyById(targetId, lastOnTarget);  
                            }
                        }
                        if(!isSilent){
                            alert("Saved all");
                        }
                        if(callback && !(!isDownload && !notify && unSaved)){
                            callback("gotAll");
                        }

                    };

                    var targetStoriesUrl = "https://www.instagram.com/graphql/query/?query_hash=5ec1d322b38839230f8e256e1f638d5f&variables=%7B%22reel_ids%22%3A%5B%22" + targetId + "%22%5D%2C%22tag_names%22%3A%5B%5D%2C%22location_ids%22%3A%5B%5D%2C%22highlight_reel_ids%22%3A%5B%5D%2C%22precomposed_overlay%22%3Afalse%2C%22show_story_viewer_list%22%3Atrue%2C%22story_viewer_fetch_count%22%3A50%2C%22story_viewer_cursor%22%3A%22%22%2C%22stories_video_dash_manifest%22%3Afalse%7D";

                    xhr2.open('GET', targetStoriesUrl);
                    xhr2.send(); 

                }else{
                    //nothing new
                    if(!isSilent){
                        alert("Allready have those!");  
                    }
                    if(callback && !(!isDownload && !notify && unSaved)){
                        callback("haveThem");
                    }
                }

            });
        }

    };
    if(offList){
        xhr.open('GET', 'https://www.instagram.com/graphql/query/?query_hash=303a4ae99711322310f25250d988f3b7&variables=%7B%22reel_ids%22%3A%5B%22' + targetId + '%22%5D%2C%22tag_names%22%3A%5B%5D%2C%22location_ids%22%3A%5B%5D%2C%22highlight_reel_ids%22%3A%5B%5D%2C%22precomposed_overlay%22%3Afalse%2C%22show_story_viewer_list%22%3Atrue%2C%22story_viewer_fetch_count%22%3A50%2C%22story_viewer_cursor%22%3A%22%22%2C%22stories_video_dash_manifest%22%3Afalse%7D');

    }else{
        xhr.open('GET', 'https://www.instagram.com/graphql/query/?query_hash=24a36f49b32dea22e33c2e6e35bad4d3&variables=%7B%22only_stories%22%3Atrue%2C%22stories_prefetch%22%3Afalse%2C%22stories_video_dash_manifest%22%3Afalse%7D');
    }
    xhr.send();
}
