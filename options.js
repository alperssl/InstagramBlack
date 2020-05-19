var settings;

var autosaverInput = document.getElementById("autosaverState");
var intervalInput = document.getElementById("interval");
var ghostModeInput = document.getElementById("ghostMode");


chrome.storage.local.get({'savedSettings': []}, function(data) {
    settings = data.savedSettings;

    if(settings.interval){
        autosaverInput.checked = settings.autosaver;
        intervalInput.value = settings.interval;
        ghostModeInput.checked = settings.ghostMode;

    }else{
        settings = {autosaver:true, interval:"30", ghostMode:false}; // default settings
        chrome.storage.local.set({'savedSettings': settings}, function() {
            //console.log("done.");
        });
    }
});

var saveBtn = document.getElementById("saveData");
saveBtn.addEventListener('click', function() {

    if(intervalInput.checkValidity()){
        settings = {autosaver:autosaverInput.checked, interval:intervalInput.value, ghostMode:ghostModeInput.checked}; // default settings
        chrome.storage.local.set({'savedSettings': settings}, function() {
            //console.log("saved.");
            chrome.runtime.sendMessage({command: "updateSettings"}, function(response) {
                //console.log(response.ok);
            });
        });
        window.close();
    }else{
        intervalInput.reportValidity();
    }

}, false);
