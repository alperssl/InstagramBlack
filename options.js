var settings;

var autosaverInput = document.getElementById("autosaverState");
var intervalInput = document.getElementById("interval");
var ghostModeInput = document.getElementById("ghostMode");
var telegramBotCheckbox = document.getElementById('telegramState');
var telegramTokenInput = document.getElementById('telegramToken');
var telegramChatIdInput = document.getElementById('telegramChatId');
var telegramNotifyCheckbox = document.getElementById('telegramNotifyState');

chrome.storage.local.get({'savedSettings': []}, function(data) {
    settings = data.savedSettings;

    if(settings.interval){
        autosaverInput.checked = settings.autosaver;
        intervalInput.value = settings.interval;
        ghostModeInput.checked = settings.ghostMode;

        telegramBotCheckbox.checked = settings.telegramBotState;
        telegramNotifyCheckbox.checked = settings.telegramNotifyState;
        telegramTokenInput.value = settings.telegramToken;
        telegramChatIdInput.value = settings.telegramChatId;

        if(telegramBotCheckbox.checked){
            var x = document.getElementsByClassName("bot");
            for (var i = 0; i < x.length; i++) {
                x[i].classList.remove("hidden");
            }
        }

    }else{
        settings = {autosaver:true, interval:"30", ghostMode:false, telegramBotState:false, telegramToken:"", telegramChatId:""}; // default settings
        chrome.storage.local.set({'savedSettings': settings}, function() {
            //console.log("done.");
        });
    }
});


telegramBotCheckbox.addEventListener('change', (event) => {
    if (event.target.checked) {

        var x = document.getElementsByClassName("bot");
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("hidden");
        }

    } else {
        telegramNotifyCheckbox.checked = false;
        var x = document.getElementsByClassName("bot");
        for (var i = 0; i < x.length; i++) {
            x[i].classList.add("hidden");
        }
    }
})

document.getElementById("clearStorage").addEventListener('click', function() {
    chrome.storage.local.remove('targetLasts');
});

document.getElementById("clearNotifyStorage").addEventListener('click', function() {
    chrome.storage.local.remove('targetNotifyLasts');
});

var saveBtn = document.getElementById("saveData");
saveBtn.addEventListener('click', function() {

    if(intervalInput.checkValidity() && !telegramBotCheckbox.checked){
        settings = {autosaver:autosaverInput.checked, interval:intervalInput.value, ghostMode:ghostModeInput.checked, telegramBotState:telegramBotCheckbox.checked, telegramToken:telegramTokenInput.value, 
                    telegramChatId:telegramChatIdInput.value, telegramNotifyState:telegramNotifyCheckbox.checked};

        chrome.storage.local.set({'savedSettings': settings}, function() {
            //console.log("saved.");
            chrome.runtime.sendMessage({command: "updateSettings"}, function(response) {
                //console.log(response.ok);
            });
        });
        window.close();
    }else if(intervalInput.checkValidity() && telegramBotCheckbox.checked && telegramTokenInput.checkValidity() && telegramChatIdInput.checkValidity()){

        settings = {autosaver:autosaverInput.checked, interval:intervalInput.value, ghostMode:ghostModeInput.checked, telegramBotState:telegramBotCheckbox.checked, telegramToken:telegramTokenInput.value, 
                    telegramChatId:telegramChatIdInput.value, telegramNotifyState:telegramNotifyCheckbox.checked};

        chrome.storage.local.set({'savedSettings': settings}, function() {
            //console.log("saved.");
            chrome.runtime.sendMessage({command: "updateSettings"}, function(response) {
                //console.log(response.ok);
            });
        });
        window.close();

    }else{
        telegramChatIdInput.reportValidity();
        telegramTokenInput.reportValidity();
        intervalInput.reportValidity();
    }

}, false);
