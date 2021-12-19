/*
    -> Dawson Reschke <-

    This file is used to understand each individule 
    api call from the steam API..
    more information below

*/

/*
-- COPY FORMAT :: PARSING ONLY THE STEAM IDS
# 342 2 "TronLegacy222" STEAM_1:1:213251027 04:44 35 0 active 196608
# 334 3 "ESPIZ" STEAM_1:1:118335495 07:50 39 0 active 196608
# 346 4 "Enemy Purple" STEAM_1:1:126461176 00:20 53 0 active 196608
# 313 5 "Koosh" STEAM_1:0:62350257 16:06 59 0 active 196608
# 345 6 "Draycing" STEAM_1:1:63357776 01:14 42 0 active 786000
# 311 7 "gunna" STEAM_1:0:104952701 18:12 36 0 active 196608
# 338 8 "CCccccc" STEAM_1:0:211441330 07:32 60 0 active 196608
# 321 9 "nikolasroh" STEAM_1:0:80710606 11:48 62 0 active 196608
# 293 10 "tk bands" STEAM_1:0:436387784 19:35 58 0 active 196608
# 319 11 "Just" STEAM_1:1:19398027 12:24 70 0 active 196608
# 344 12 "hewi^" STEAM_1:0:76759918 03:49 76 0 active 196608
# 265 13 "Funny Cat" STEAM_1:0:121293265 32:33 171 0 active 786432
# 340 14 "Mindless" STEAM_1:1:104140541 07:08 79 0 active 196608
# 314 15 "Yung Fiddy" STEAM_1:1:538199403 16:06 60 0 active 196608
# 341 16 "hvn" STEAM_1:1:1884053 06:20 78 0 active 256000
# 316 19 "Whiteshadow" STEAM_1:0:100680324 15:18 47 0 active 196608


# userid name uniqueid connected ping loss state rate
#  3 2 "Spxzxf" STEAM_1:0:600422902 34:11 46 0 active 196608
# 15 3 "OnionChan" STEAM_1:1:505895895 02:22 88 0 active 196608
# 16 4 "TheLadyLuna" STEAM_1:0:440350032 00:47 108 0 active 786432
#  7 6 "Enemy Purple" STEAM_1:1:126461176 34:11 72 0 active 196608
#  8 7 "phantom" STEAM_1:0:96206274 34:11 47 0 active 196608
#  9 8 "drizzzii" STEAM_1:0:178799967 34:11 46 4 active 196608
# 12 11 "Uninstalling" STEAM_1:0:505470373 34:10 80 0 active 196608
# 13 12 "OneTap" STEAM_1:0:473258282 34:10 93 0 active 786432
# 14 13 ".IceBear" STEAM_1:0:236322580 34:10 138 0 active 786432

teams: 
    1.
        OnionChan       15, 3
        Enemy Purple    7 , 6
        Uninstalling    12, 11
        drizzzii        9 , 8 
        Spxzxf          3 , 2 
    2.
        TheLadyLuna     16, 4
        phantom         8 , 7 
        IceBear         14, 13
        OneTap          13, 12
// 2 : SP

// split by ' ' find the ones that contains ("STEAM") using this we can understand their stats, first we must convert to steam 64 I think... lets check
*/

import fetch from "node-fetch";
const steamConvertTo64Int = 76561197960265728n
const steamID = 'STEAM_1:1:126461176'
const key = 'FE57479D48DDA7694ABA7FC43ECC83E8'
let uData;
let userSteamLevel;
let userStats; 
let userBanRecord; 
let userGamesOwnedData; 

//««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««
// get summary data
//««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««
/*
RESPONSE FORMAT: 
response: {
    players[
        "steamid": "76561198213188081",
        "communityvisibilitystate": 3,
        "profilestate": 1,
        "personaname": "Enemy Purple",
        "profileurl": "https://steamcommunity.com/profiles/76561198213188081/",
        "avatar": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/21/217ccd4b4c1a10f06b4dd7c58f732a31d7d4c12f.jpg",
        "avatarmedium": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/21/217ccd4b4c1a10f06b4dd7c58f732a31d7d4c12f_medium.jpg",
        "avatarfull": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/21/217ccd4b4c1a10f06b4dd7c58f732a31d7d4c12f_full.jpg",
        "avatarhash": "217ccd4b4c1a10f06b4dd7c58f732a31d7d4c12f",
        "lastlogoff": 1639752877,
        "personastate": 1,
        "primaryclanid": "103582791460070057",
        "timecreated": 1439867242,
        "personastateflags": 0,
        "loccountrycode": "US",
        "locstatecode": "OR",
        "loccityid": 3213
    ]
}
*/

 async function getUserData (steamid){
    const URL = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2'
    let temp = fetch(`${URL}/?key=${key}&steamids=${steamIdToSteam64(steamid)}`).then(response => response.json()).then(data => uData = data['response']['players'][0]).catch(error => uData = 'error');
    //USEFULL DATA: avatar, date created, communityvisibilitystate
}

//««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««
// get ingame stats
//««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««

/*
    RESPONSE FORMAT: 
    playerstats:{
        steamID:76561198325083676,
        gameName:ValveTestApp260,
        stats: [{name:total_kills,value:51237},,,[187]]
    }
*/

function getUserStatsFromGame(steamid){
    const URL = 'https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/'
    const appID = '000730'
    let temp = fetch(`${URL}/?key=${key}&steamid=${steamIdToSteam64(steamid)}&appid=${appID}`).then(response => response.json()).then(data => userStats = data); 
    // NOW: parse the data, get all relative information, including: 
    //USEFULL DATA : 
    //kills, HEADSHOTS, wins,losses, shots hit, shots fired, 
    //LAST MATCH DATA: 
    //kills,deaths,mvps,dmg,dominations,
    // ACHIEVMENT: count the number, compare it to the max, only sus if 100%
}

//««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««
// get banned information... 
//««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««

/*
    RESPONSE FORMAT: 
    players:{
        [
            {
                "SteamId": "76561198213188081",
                "CommunityBanned": false,
                "VACBanned": false,
                "NumberOfVACBans": 0,
                "DaysSinceLastBan": 1394,
                "NumberOfGameBans": 1,
                "EconomyBan": "none"
            },
        ]   
    }
*/

function getUserBanRecord(steamids){
    const URL = 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/'
    let temp = fetch(`${URL}?key=${key}&steamids=${steamIdToSteam64(steamids)}`).then(response => response.json()).then(data => userBanRecord = data); 
}

//««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««
// get steam level
//««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««

/*
    RESPONSE FORMAT:
    response: { 
        "player_level": 9
    }
*/

function getUserSteamLevel(steamid){
    const URL = 'https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/'
    let temp = fetch(`${URL}?key=${key}&steamid=${steamIdToSteam64(steamid)}`).then(response => response.json()).then(data => userSteamLevel = data['response']); 
}

/*
    RESPONSE: 
    resonse:{
        game_count: 92,
        games: 
        [
            {
                "appid": 4000,
                "playtime_forever": 5785,
                "playtime_windows_forever": 1346,
                "playtime_mac_forever": 0,
                "playtime_linux_forever": 0
            },
        ]
    }
*/
//GET https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/
function getUserHoursPlayed(steamid){
    const URL = 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/'
    let temp = fetch(`${URL}?key=${key}&steamid=${steamIdToSteam64(steamid)}&include_appinfo=false&include_played_free_games=true&appids_filter=000730`).then(response => response.json()).then(data => userGamesOwnedData = data['response']['games'].filter((val) => {
        return val['appid'] == 730; 
    })); 
}


//this method is neccessary for converting from steamID to steam64ID so that we can pass in steam64 into api calls...
function steamIdToSteam64(str){
    // split by : 
    // 64id = ([2] * 2) + [1] + big int
    let x = BigInt(str.split(':')[1])
    let y = BigInt(str.split(':')[2])
    let steam64ID = (y *2n) + x + steamConvertTo64Int; 
    return steam64ID; 
}


getUserData(steamID);
getUserStatsFromGame(steamID);
getUserSteamLevel(steamID); 
getUserBanRecord(steamID); 
getUserHoursPlayed(steamID); 
setTimeout(() => {
    console.log(JSON.stringify(uData, null, 4));
    console.log(JSON.stringify(userSteamLevel,null,4)); 
    console.log(JSON.stringify(userBanRecord,null,4)); 
    console.log(JSON.stringify(userGamesOwnedData,null,4));
    console.log(JSON.stringify(userStats['playerstats']['achievements'].length));
    console.log(JSON.stringify(userStats['playerstats']['stats'].length));
}, 1000);