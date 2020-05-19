var cookiesURL = "http://www.google.com";

var autosaveInterval = "30";

var ghostModeState = false;

var autosaveState = true;

var watchList;


var settings;


function updateSettings(){

    chrome.storage.local.get({'savedSettings': []}, function(data) {
        settings = data.savedSettings;

        if(settings.interval){
            autosaveState = settings.autosaver;
            autosaveInterval = settings.interval;
            ghostModeState = settings.ghostMode;

            if(chrome.extension.getViews({ type: "popup" }).length > 0){
                chrome.runtime.sendMessage({command: "updatePopup"}, function(response) {
                    //console.log("settings and popup updated.");
                });
            }


        }else{
            settings = {autosaver:autosaveState, interval:autosaveInterval, ghostMode:ghostModeState}; // default settings
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
    { urls: [ '*://*.instagram.com/stories/reel/seen*' ] },
    [ 'blocking' ]
);



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
                    check(id, false);
                }else{
                    alert("Invalid User!");
                }
                sendResponse({resp: "ok"});
            });
            return true;
        }
        if (request.command == "checkId"){
            check(request.id, false);
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
            autosave();
        }
    });   
}
refreshWatchlist();






// Automated Save Function **********************
function autosave(){
    if(autosaveState){  // only if enabled
        if(watchList && watchList.length > 0){
            //console.log('autosave Called');
            for (var i = 0; i < watchList.length; i++) {
                check(watchList[i].id, true);
            }       
        }
    }
}

autosave();

setInterval(function(){
    autosave();
}, (parseInt(autosaveInterval)*1000));

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


function getCookie(name, callback) {
    chrome.cookies.get({"url": cookiesURL, "name": name}, function(cookie) {
        if(callback) {
            if(cookie){
                callback(cookie.value);
            }else{
                chrome.cookies.set({"url": cookiesURL, "name": name, "value": "0"});
                callback("0");
            }
        }
    });
}



function check(targetId, isSilent){
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var json = xhr.responseText;                         // Response
        json = json.replace(/^[^(]*\(([\S\s]+)\);?$/, '$1'); // Turn JSONP in JSON
        json = JSON.parse(json);

        var allStories = json.data.user.feed_reels_tray.edge_reels_tray_to_reel.edges;

        var storiesOfTarget = null;

        for(var x in allStories){
            if(allStories[x].node.id == targetId){
                storiesOfTarget = allStories[x];
            }
        }
        // we got stories of target

        if(storiesOfTarget == null){               // but there is no stories
            if(!isSilent){
                alert("Nothing shared!");  
            }
        }else{                                     // there are stories but we have to check if we have them allready
            getCookie(targetId, function(lastOnWe) {
                //we downloaded lastly 'lastOnWe'
                //console.log(lastOnWe);

                //check if last story of target downloaded
                var lastOnTarget = storiesOfTarget.node.latest_reel_media;
                //console.log(storiesOfTarget.node.latest_reel_media);

                if(lastOnTarget > parseInt(lastOnWe)){
                    //there is news
                    //console.log("Second JSON request sent");
                    //save them


                    var xhr2 = new XMLHttpRequest();
                    xhr2.onload = function() {
                        var json2 = xhr2.responseText;                         // Response
                        json2 = json2.replace(/^[^(]*\(([\S\s]+)\);?$/, '$1'); // Turn JSONP in JSON
                        json2 = JSON.parse(json2);         

                        // we got all we need which what is on tagets story circle
                        //console.log(json2);

                        var storyDataOfTarget = json2.data.reels_media[0].items; // all stories curently in circle
                        var storyCountOnCircle = json2.data.reels_media[0].items.length;
                        lastOnTarget = json2.data.reels_media[0].latest_reel_media;
                        var targetUsername = json2.data.reels_media[0].owner.username;

                        var lastWeHaveOnCircle = -1;

                        for(var x in storyDataOfTarget){
                            if(storyDataOfTarget[x].taken_at_timestamp == lastOnWe){
                                lastWeHaveOnCircle = x;
                            }
                        }

                        if(lastWeHaveOnCircle == -1){  // if we dont have any of circle stories, start saving from 0
                            //console.log("we dont have any of circle stories");

                            for(var x in storyDataOfTarget){
                                if(storyDataOfTarget[x].is_video == true){
                                    //save as video
                                    var fileName = storyDataOfTarget[x].taken_at_timestamp;
                                    var videoRes = storyDataOfTarget[x].video_resources;
                                    var fileURL = videoRes[videoRes.length-1].src;

                                    chrome.downloads.download({
                                        url: fileURL,
                                        filename: "autosavedstories/" + targetUsername + "/" + targetUsername + "_" + fileName + ".mp4"
                                    });

                                }else{
                                    //save as photo
                                    var fileName = storyDataOfTarget[x].taken_at_timestamp;
                                    var photoRes = storyDataOfTarget[x].display_resources;
                                    var fileURL = photoRes[photoRes.length-1].src;

                                    chrome.downloads.download({
                                        url: fileURL,
                                        filename: "autosavedstories/" + targetUsername + "/" + targetUsername + "_" + fileName + ".jpg"
                                    });

                                }
                            }




                        }else{ // if we have some allready then start from where we stay
                            //console.log("last we have on circle: " + lastWeHaveOnCircle);

                            //console.log(storyCountOnCircle);

                            var xyz = parseInt(lastWeHaveOnCircle) + 1;

                            for(var x = xyz; x < storyCountOnCircle; x++){
                                if(storyDataOfTarget[x].is_video == true){
                                    //save as video
                                    var fileName = storyDataOfTarget[x].taken_at_timestamp;
                                    var videoRes = storyDataOfTarget[x].video_resources;
                                    var fileURL = videoRes[videoRes.length-1].src;

                                    chrome.downloads.download({
                                        url: fileURL,
                                        filename: "autosavedstories/" + targetUsername + "/" + targetUsername + "_" + fileName + ".mp4"
                                    });

                                }else{
                                    //save as photo
                                    var fileName = storyDataOfTarget[x].taken_at_timestamp;
                                    var photoRes = storyDataOfTarget[x].display_resources;
                                    var fileURL = photoRes[photoRes.length-1].src;

                                    chrome.downloads.download({
                                        url: fileURL,
                                        filename: "autosavedstories/" + targetUsername + "/" + targetUsername + "_" + fileName + ".jpg"
                                    });

                                }
                            }




                        }


                        //after save, set cookie
                        chrome.cookies.set({"url": cookiesURL, "name": targetId, "value": lastOnTarget.toString()});
                        if(!isSilent){
                            alert("Saved all");  
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
                }




            });
        }

    };
    xhr.open('GET', 'https://www.instagram.com/graphql/query/?query_hash=04334405dbdef91f2c4e207b84c204d7&variables=%7B%22only_stories%22%3Atrue%2C%22stories_prefetch%22%3Afalse%2C%22stories_video_dash_manifest%22%3Afalse%7D');
    xhr.send(); 
}



















