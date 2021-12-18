/*
    -> Dawson Reschke <-

    This file is used to understand each individule 
    api call from the steam API..
    more information below
*/
import fetch from "node-fetch";
const steamID = '76561198213188081'
const key = 'FE57479D48DDA7694ABA7FC43ECC83E8'
let uData;
let serveripList; 
 async function getUserData (steamid){
    // this method takes a users steam id
//https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={key}&steamids=76561197960361544
    const URL = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2'
    let temp = fetch(`${URL}/?key=${key}&steamids=${steamid}`).then(response => response.json()).then(data => uData = data);
}

async function getServerSteamIDsByIP(ip) {
    const URL = 'https://api.steampowered.com/IGameServersService/GetServerSteamIDsByIP/v1'
    let temp = fetch(`${URL}/?key=${key}&server_ips=${ip}`).then(response => response.json()).then(data => steamidList = data)
}

async function getServerIPsBySteamID(steamids) {
    const URL = 'https://api.steampowered.com/IGameServersService/GetServerIPsBySteamID/v1'
    let temp = fetch(`${URL}/?key=${key}&server_steamids=${steamids}`).then(response => response.json()).then(data => serveripList = data);
}

getUserData(steamID);
getServerIPsBySteamID(steamID); 
setTimeout(() => {
    console.log(JSON.stringify(uData, null, 4));
    console.log(JSON.stringify(serveripList,null,4))
}, 1000);