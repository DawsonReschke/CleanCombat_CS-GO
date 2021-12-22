const express = require('express');
require('dotenv').config();
const XMLHttpRequest  = require('xhr2')
let payload = {};
const router = express.Router();
const key = process.env.KEY; 
router.post('/', async (req, res,next) => {
    try{
        const {body} = req; 
        const {message} = body; 
        const steamIDs = parseSteamIDs(message); 
        let steam64IDs = steamIDs.map(id =>{
            return String(steamIDtosteam64(id)); 
        })
        initializePayload(steam64IDs);
        await handleSteamAPICalls(steam64IDs); 
        res.json(payload); 
    }catch(error){
        next(error); 
    }
});
router.get('/', async(req,res,next)=>{
    try {
        const {body} = req; 
        res.json(body); 
    } catch (error) {
        next(error); 
    }
})

// responseFormat : example: {something that you want to parse:{}}
//response:{players:[]}; 
// in order to use this code we need to stuff it into a promise...
function createRequest(url){
    return new Promise(function(resolve,reject){
        const xhr = new XMLHttpRequest(); 
        xhr.open("GET",url); 
        xhr.send(); 
        xhr.onload = function(){
            if(xhr.status == 200){
                let data = JSON.parse(xhr.responseText); 
                resolve(data); 
            }else{
                resolve({status: xhr.status,errorMessage:xhr.statusMessage}); 
            }
        }
        xhr.onerror = function(){
            console.log('an error has occured');
            resolve({status:0,statusMessage:'network error'}); 
        }
    })
}

function initializePayload(steamids){
    payload = {}
    steamids.forEach((val)=>{
        payload[val] = {
            'owned_game_data' : {},
            'user_data' : {},
            'steam_level': 0,
            'user_ban_record':{},
            'user_game_stats':{},
        }; 
    })
}

// handler function for doing all api calls...
async function handleSteamAPICalls(steamids){
    await getUsersStatsFromGame(steamids);
    await getUsersData(steamids); 
    await getUsersSteamLevel(steamids); 
    await getUsersHoursPlayed(steamids); 
    await getUsersBanRecord(steamids)
    // this method calls each api in order each after the last has completed...
}

async function getUsersStatsFromGame(steamids){
    for(let i = 0; i < steamids.length; i++){
            payload[steamids[i]]['user_game_stats'] = await getUserStatsFromGame(steamids[i]); 
    }
}

async function getUsersHoursPlayed(steamids){
    for(let i = 0; i < steamids.length; i++){
        if(!payload[steamids[i]]){payload[steamids[i]]={}}
        payload[steamids[i]]['owned_game_data'] = await getUserHoursPlayed(steamids[i]); 
    }
}

async function getUsersBanRecord(steamids){
    let arr = await getUserBanRecord(steamids); 
    arr.forEach((val)=>{
        let ID = val['SteamId']
        delete val['SteamId']
        payload[ID]['user_ban_record'] = val; 
    })
}

async function getUsersData (steamids){
    const URL = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&&steamids=${steamids}`
    const steamUsersData = await createRequest(URL); 
    parseUserData(steamUsersData,payload); 
}

async function getUsersSteamLevel(steamids){
    for(let i = 0; i < steamids.length; i++){
        if(!payload[steamids[i]]){payload[steamids[i]]={}}
        payload[steamids[i]]['steam_level'] = {}
        payload[steamids[i]]['steam_level'] = await getUserSteamLevel(steamids[i])
    }
}

function parseUserData(response){
    const keysToRemove = ['lastlogoff','commentpermission','avatarmedium','avatarfull','avatarhash','personastate','realname','primaryclanid','personastateflags','loccountrycode','locstatecode','loccityid']
    const SteamResponsePlayerArray = response['response']['players']; 
    SteamResponsePlayerArray.forEach((userSummaryData)=>{
        for(let i = 0; i< keysToRemove.length; i++){
            delete userSummaryData[keysToRemove[i]]
        }
        let userSteamID = userSummaryData['steamid']; 
        delete userSummaryData['steamid']
        if(!payload[String(userSteamID)]){
            payload[String(userSteamID)] = {};
        }
        payload[String(userSteamID)]['user_data'] = userSummaryData; 
    })
}

async function getUserStatsFromGame(steamid){
    const URL = 'https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/'
    const appID = '000730'
    const steamUserStatsFromGameResponse = await createRequest(`${URL}/?key=${key}&steamid=${(steamid)}&appid=${appID}`)
    const parsedJSON = parseUserStatsFromGame(steamUserStatsFromGameResponse); 
    return parsedJSON; 
}

function parseUserStatsFromGame(userStatsFromGame){
    const keys = (Object.keys(userStatsFromGame))
    if(keys.includes('status')){
        return; 
    }
    const steamid = parseSteamidFromUserStats(userStatsFromGame); 
    const achievmentCount = parseAchievments(userStatsFromGame);
    const lastMatchData = parseLastMatch(userStatsFromGame); 
    const generalMatchData = parseGeneralMatchData(userStatsFromGame); 
    const parsedUserStats = {
        'achievment_count': achievmentCount,
        'last_match_data': lastMatchData,
        'general_stats': generalMatchData,
    }
    return parsedUserStats; 
}

function parseAchievments(ach){
    const achievmentCount = Object.keys(ach['playerstats']['achievements']).length;
    return achievmentCount; 
}
function parseSteamidFromUserStats(userStatsFromGame){
    return userStatsFromGame['playerstats']['steamID'];
}
function parseLastMatch(userStatsFromGame){
    const lastMatchData = {}; 
    Object.keys(userStatsFromGame['playerstats']['stats']).forEach((userStat)=>{
        if(userStatsFromGame['playerstats']['stats'][userStat].name.includes('last')){
            lastMatchData[userStatsFromGame['playerstats']['stats'][userStat].name] = userStatsFromGame['playerstats']['stats'][userStat].value; 
        }
    })
    return lastMatchData; 
}

function parseGeneralMatchData(userStatsFromGame){
    const tempRef = userStatsFromGame['playerstats']['stats']
    const generalMatchData = {}; 
    const individuleGunData = {};
    const keyPairsForGeneralStats = [['total_kills','total_deaths','KD_Ratio'],['total_kills_headshot','total_kills','HS_Ratio'],['total_shots_hit','total_shots_fired','accuracy'],['total_wins','total_rounds_played','round_win_ratio'],['total_mvps','total_rounds_played','MVP_ratio'],['total_matches_won','total_matches_played','Win_ratio']]
        // compare as in key3 = (key1 / key2) thats it... used for finding averages and things. 
    const gunIDS = ['awp','ak47','aug','deagle','glock','elite','fiveseven','famas','g3sg1','p90','mac10','ump45','xm1014','m249','hkp2000','p250','sg556','scar20','ssg08','mp7','nova','negev','sawedoff','bizon','tec9','mag7','m4a1','galilar'] 
    const keysForGunStats =['total_shots_','total_hits_','total_kills_'] 
        // with these stats we can calculate, weapon accuracy, weapon avg shots to kill, weapon avg hit to kill, usefull for determining headshot% for given weapon\
    for(let i = 0; i < keyPairsForGeneralStats.length; i++){
        generalMatchData[keyPairsForGeneralStats[i][2]] = tempRef[getStatIndex(tempRef,keyPairsForGeneralStats[i][0])].value / tempRef[getStatIndex(tempRef,keyPairsForGeneralStats[i][1])].value; 
    }
    for(let i = 0; i < gunIDS.length; i++){
        const total_shots_currentGun = tempRef[getStatIndex(tempRef,`${keysForGunStats[0]}${gunIDS[i]}`)].value;
        const total_hits_currentGun = tempRef[getStatIndex(tempRef,`${keysForGunStats[1]}${gunIDS[i]}`)].value;
        const total_kills_currentGun = tempRef[getStatIndex(tempRef,`${keysForGunStats[2]}${gunIDS[i]}`)].value;
        const currentGunStats = 
        {
            accuracy: total_hits_currentGun/total_shots_currentGun,
            'shots_kill': total_shots_currentGun / total_kills_currentGun,
            'hits_kill' : total_hits_currentGun/total_kills_currentGun,
        }
        generalMatchData[gunIDS[i]] = currentGunStats
    }
    return generalMatchData; 
}

function getStatIndex(statsList,name){
    let statIndex = 0; 
    statsList.forEach((stat,index)=>{
        if(stat.name == name){
            statIndex = index; 
        }
    })
    return statIndex; 
}


async function getUserBanRecord(steamids){ // only call once with all steam ids 
    const URL = 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/'
    let response = await createRequest(`${URL}?key=${key}&steamids=${(steamids)}`);
    return parseUserBanRecord(response); 
}

function parseUserBanRecord(res){
    return res['players']; 
}

async function getUserSteamLevel(steamid){
    const URL = 'https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/'
    const response = await createRequest(`${URL}?key=${key}&steamid=${(steamid)}`)
    return parseUserSteamLevel(response); 
}

function parseUserSteamLevel(res){
    return res['response']['player_level']
}

async function getUserHoursPlayed(steamid){
    const URL = 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/'
    const response = await createRequest(`${URL}?key=${key}&steamid=${(steamid)}&include_appinfo=false&include_played_free_games=true`);
    return parseHoursPlayed(response); 
}

function parseHoursPlayed(res){
    const userGamesOwned = res['response']['game_count'];
    if(res['response']['games']){
        const userCSGOPlayTime = res['response']['games'].filter((val)=>{
            return val['appid'] == 730; 
        })
        return {
            'games_owned':userGamesOwned,
            'play_time': userCSGOPlayTime[0]["playtime_forever"],
        }
    }
    return {}
}

function parseSteamIDs(str){
    const splitBySpace = str.split(' '); 
    const steamIDs = splitBySpace.filter(val=>{
        return (val.includes('STEAM'))
    })
    return steamIDs; 
}

function steamIDtosteam64(steamid){
    const parsed = steamid.split(':'); 
    const x = parsed[1]; 
    const y = parsed[2]; 
    return (BigInt(y) * 2n) + BigInt(x) + 76561197960265728n;
}


/*
    step 1 on POST: 
        parse the large string into the steamids,
        parse the steamids, convert into steam64ids
    step 2: 
        using the steam64ids call each steam api and fill the payload: 
            FORMAT:
                players: {
                    {
                        steamid: String, // users steamid 
                        userName: String,// users display name
                        avatar: String,  // users profile picture
                        HS: Number,      // users headshot percentage :: 0 - 100 
                        WL: Number,      // users win loss ratio      :: 0 - 100
                        cheaterNumber: number, // how likely the user is cheating :: 0 - 20?
                    }
                }
*/

module.exports = router;