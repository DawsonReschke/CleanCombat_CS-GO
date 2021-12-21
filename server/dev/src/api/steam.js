const express = require('express');
require('dotenv').config();
const XMLHttpRequest  = require('xhr2')

const router = express.Router();
const key = process.env.KEY; 
console.log(key); 
let payload = {
    gotUserData:false,
}
router.post('/', async (req, res,next) => {
    try{
        const {body} = req; 
        const {message} = body; 
        const steamIDs = parseSteamIDs(message); 
        let steam64IDs = steamIDs.map(id =>{
            return String(steamIDtosteam64(id)); 
        })
        payload['players'] = steam64IDs.map(_id => {
            return {steamid:_id}
        });
        getUserData(getSteamIDs()); 
        console.log("payload: "); 
        console.log(payload);
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


function resetPayload(){
    payload = {
        gotUserData:false,
    }
}

// responseFormat : example: {something that you want to parse:{}}
//response:{players:[]}; 
 function createRequest(url,parsingMethod){
    const xhr = new XMLHttpRequest(); 
    xhr.open("GET",url); 
    xhr.send(); 
    xhr.onload = function(){
        if(xhr.status != 404){
            let data = JSON.parse(xhr.responseText); 
            parsingMethod(data); 
        }else{
            parsingMethod('error'); 
        }
    }
    xhr.onerror = function(){
        console.log('an error has occured');
        parsingMethod('error'); 
    }
    xhr.onprogress = function(e) {
        if (e.lengthComputable) {
          console.log(`${e.loaded} B of ${e.total} B loaded!`)
        } else {
          console.log(`${e.loaded} B loaded!`)
        }
      }
}

// handler function for doing all api calls...
function handleSteamAPICalls(steamids){
    // this method calls each api in order each after the last has completed...
}

async function getUserData (steamids){
    const URL = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&&steamids=${steamids}`
    createRequest(URL,parseUserData); 
}

function parseUserData(res){
    const keysToRemove = ['personaname','commentpermission','avatarmedium','avatarfull','avatarhash','personastate','realname','primaryclanid','personastateflags','loccountrycode','locstatecode','loccityid']
    const data = res['response']['players']; 
    const playersLength = Object.keys(payload['players']).length; 
    console.log(`players length ${playersLength}`); 
    data.forEach((val)=>{
        for(let i = 0; i< keysToRemove.length; i++){
            delete val[keysToRemove[i]]
        }
        let id = val['steamid']; 
        for(let i = 0; i < playersLength; i++){
            console.log(i);
            if(payload['players'][i].steamid == id){
                payload['players'][i] = val;
            }
        }
    })
}


function getUserStatsFromGame(steamid){
    const URL = 'https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/'
    const appID = '000730'
    let temp = fetch(`${URL}/?key=${key}&steamid=${(steamid)}&appid=${appID}`).then(response => response.json()).then(data => userStats = data); 
    // NOW: parse the data, get all relative information, including: 
    //USEFULL DATA : 
    //kills, HEADSHOTS, wins,losses, shots hit, shots fired, 
    //LAST MATCH DATA: 
    //kills,deaths,mvps,dmg,dominations,
    // ACHIEVMENT: count the number, compare it to the max, only sus if 100%
}

function getUserBanRecord(steamids){ // only call once with all steam ids 
    const URL = 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/'
    let temp = fetch(`${URL}?key=${key}&steamids=${(steamids)}`).then(response => response.json()).then(data => userBanRecord = data); 
}

function getUserSteamLevel(steamid){
    const URL = 'https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/'
    let temp = fetch(`${URL}?key=${key}&steamid=${(steamid)}`).then(response => response.json()).then(data => userSteamLevel = data['response']); 
}

function getUserHoursPlayed(steamid){
    const URL = 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/'
    let temp = fetch(`${URL}?key=${key}&steamid=${(steamid)}&include_appinfo=false&include_played_free_games=true&appids_filter=000730`).then(response => response.json()).then(data => userGamesOwnedData = data['response']['games'].filter((val) => {
        return val['appid'] == 730; 
    })); 
}

function getSteamIDs(){
    let allIDs = ''
    payload['players'].forEach(item => {
        allIDs += `${item.steamid},`
    });
    return allIDs; 
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