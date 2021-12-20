const express = require('express');
const https = require('https')
const router = express.Router();
const payload = {gotUserData:false}
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

// handler function for doing all api calls...
function handleSteamAPICalls(steamids){
    // this method calls each api in order each after the last has completed...
}

function getSteamIDs(){
    let allIDs = ''
    payload['players'].forEach(item => {
        allIDs += `${item.steamid},`
    });
    return allIDs; 
}

async function getUserData (steamids){
    console.log("HERE");
    const URL = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2'
    let temp = fetch(`${URL}/?key=${process.env.STEAMAPIKEY}&steamids=${steamids}`).then(response => response.json()).then(data => {
        // for(let i = 0; i < payload['players'].length; i++){
        //     console.log("HREE");
        //     payload['players'][i] = data['response']['players'][i]
        // }
        // payload.gotUserData = true; 
        // console.log("done!");
    }).catch(error => uData = 'error')
    //USEFULL DATA: avatar, date created, communityvisibilitystate
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

module.exports = router;