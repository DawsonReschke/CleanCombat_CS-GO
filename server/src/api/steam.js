/*
    --> Dawson Reschke <--
    This application finds and returns steam user data, as well as storing the data, and finding statistical probability of a givin player cheating.... 
*/

/** 
 * @todo Over arching notes: 
 * We should separate the database with the api in the file system (something like /api_route & /api_model) 
 * also creating a connection function that will return a connected object we can act on directly stored in (example: /cwd/data/dbConfig.js)
*/


/** 
 * @todo ensure we are using the write imports 
 * I am unsure about xhr2 I think there are better xhr request libraries to use
 * Remove unused vars
 * should we use a global variable for the payload? NO that is not the way we should be going about this:
 *      - we should have an object that we pass though out the chain of functions which can all edit the object  
*/
const express = require('express');
require('dotenv').config();
const XMLHttpRequest  = require('xhr2')
const { MongoClient,ObjectId, TopologyDescriptionChangedEvent } = require('mongodb');
let payload = {};
const router = express.Router();
const key = process.env.KEY; 


/** 
 * @todo Remove this route 
*/
router.put('/',async(req,res,next)=>{
    try {
        
        // await UpdateStandardDeviation({}); 
    } catch (error) {
        
    }
})


/** 
 * @todo Document this route 
 * This route could be a get route since we pass the steam_ids as query param, though since we are saving the user data in a database this could be justified (not sure)
 * I think instead of passing the 'Median_abs_dev' document from the DB so the front end could do all the work we should
 *  - Send a probability score in the response object for each player
 *  - Send only the important information in the response we can avoid sending things
 *      - all gun data (only send the important ones (maybe their best and their most suspicious for example))
 *      - dont need to send owned_game data
 *      - user_data 
 *      - ban_record (maybe we keep)
 * what we should send in the response object: 
 *  - some game stats 
 *      - their best guns
 *          - highest accuracy  
 *          - highest kill count 
 *      - their most suspicious guns if any
 *      - their z-score (overall) how sus they are   
 *  - some steam info 
 *      - profile url 
 *      - profile image
 *      - profile name
 *      - steam level (often used to asses a players legitimacy) 
 *      - ban record(maybe)
*/
router.post('/', async (req, res,next) => {
    try{
        const {body} = req; 
        // const {message} = body; 
        const {ids} = req.query; 
        const steamIds = ids.split(',')
        await handleSteamAPICalls(steamIds); 
        await Insert_All_Steam_Users_From_Payload(payload);
        await Query_Database({_id: 'Median_Absolute_Deviation_Data'},true,(val)=>{
            payload['Median_abs_dev'] = val;
            res.json(payload); 
        },{_id:1,data:1})
        
    }catch(error){
        next(error); 
    }
});

/** 
 * @todo Document this route
 * The route seems to be for updating the median absolute deviation internally and should not be exposed to the public (perhaps this would operate on a schedule and does not need a route OR we have private routes we can call with authorization) 
*/
router.get('/', async(req,res,next)=>{
    try {
        const {body} = req; 
        Update_Median_Absolute_Deviations(Update_One); 
        res.json(body); 
    } catch (error) {
        next(error); 
    }
})

/** 
 * @todo Document route
 * This route seems to clean the database again should not be a public route and requires authorization 
*/
router.delete('/',async(req,res,next)=>{
    try{
        const {auth} = req.query; 
        const forbidin_ids = ['accuracy_standard_deviation',true]
        if(auth == process.env.AUTH_TOKEN){
            await Get_All_Steam_Ids_From_Database(Update_All_Users);
            await Update_Median_Absolute_Deviations(Update_One); 
            res.json({"message":"success"}); 
        }else{
            res.json({"message":"access denied"})
        }
    }catch(error){
        next(error); 
    }
})

/*
Median Absolute Deviation(x):
    k = 1.4826          // constant
    median = x[x.len/2] // median of the set x
    absoluteDeviations(x) = abs(x[i] - median) // median absolute deviations of set x
    MED = absoluteDeviations[absoluteDeviations.len/2] // median of absolute deviations of x

ScoreDeviationValue(x):                                                         
    threshhold = {X| 2 < x < 3}
    score = abs(x[i] - median) / (MED * k) // we want all values to be : {X | -threshhold < x < threshhold}

// NOTE:
    We need to find the median , MED of each of the following sets within the database:
        a. awp.acc / acc
        b. ak47.acc / acc
        c. aug.acc / acc
        .
        .
        .
    the issue here is that we need to find a way to collect this data in minimal DB calls while also keeping in mind the 16mb doccument limmit. 
    // perhaps we can do this with no effort using aggregation, lets see:
        collection.aggregate([
            {$match:{$ne:[Steam_Data.user_game_stats,null]}}
        ])
*/

/*
    Database:
    steamids:{
        Steam_Data:{
            user_data:{}
            user_game_stats:{
                achievments:#
                last_match_data:{}
                general_stats:{
                    accuracy,
                    kill/death_ratio,
                    headshot_ratio,
                    win_ratio,
                    round_win_ratio,
                    MVP_ratio,
                    forEachGun:{
                        accuracy,            // overall accuracy with this gun
                        normalized_accuracy, // gun accuracy / total accuracy       :: the idea here is that a player with a high overall accuracy should also have a high individual gun accuracy, so if we take the quotient of the two we should get a generalized accuracy that we can compare amoung all players good and bad....
                        shots_kill,          // overall shots to kill with this gun
                        hits_kill,           // overal hits to kill with this gun

                    }
                },

            }
        }
    }
    statistic_data:{forEachGun:{mean:($avg:(Gun.acc/acc)),standDev:($stdpop:(Gun.acc/acc))}}
    //                         

*/



/** 
 * @todo This function can be replaced with a library to do this for use 
*/
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


/** 
 * @todo document this function 
 * Remove the callback ideology, since there is no reason to close the connection this process not only makes the entire application less efficient it also makes working with the data more tedious.  
 * This function could be moved to (cwd/data/dbConfig.js) 
 * remove console.logs statements when not in debug mode
*/
//                                  array     callback
async function Aggregate_Database(aggregation,callback){
    console.log('this method was called'); 
    const client = await MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect(async (err) => {
        const collection = client.db("cheaterDB").collection("players");  
        callback(await collection.aggregate(aggregation).toArray());     
        client.close();
      });
}


/** 
 * @todo document this function 
 * This function name is bad and long 
 * this function seems to have a large hard coded schema type object for aggregating the database that we could use a schema validator for 
 * this should be in a data directory (/api/steam/model.js)
*/
async function Get_All_User_Gun_Stats(callback){
            // this aggregation searches for only doccuments where the user has game stats.... 
            const aggregation = [
                {'$match': 
                {"Steam_Data.user_game_stats.general_stats":{$exists:true}}
                },
                {'$project':{
                    _id:0,
                    "Steam_Data.owned_game_data":0,
                    "Steam_Data.user_data":0,
                    "Steam_Data.steam_level":0,
                    "Steam_Data.user_vac_ban":0,
                    "Steam_Data.user_ban_record":0,
                    "Steam_Data.user_game_stats.achievment_count":0,
                    "Steam_Data.user_game_stats.last_match_data":0,
                    "Steam_Data.user_game_stats.general_stats.KD_Ratio":0,
                    "Steam_Data.user_game_stats.general_stats.HS_Ratio":0,
                    "Steam_Data.user_game_stats.general_stats.accuracy":0,
                    "Steam_Data.user_game_stats.general_stats.round_win_ratio":0,
                    "Steam_Data.user_game_stats.general_stats.MVP_ratio":0,
                    "Steam_Data.user_game_stats.general_stats.Win_ratio":0,
                }}
            ]
            await Aggregate_Database(aggregation, callback)
}


/** 
 * @todo Document function 
 * This function is a helper function which allows for the developer to specify what they are trying to obtain from the database as well as what they want to project. 
 * Remove the callback return the data. 
 * This function is likely not valuable enough to keep as we are only combining two chainable functions and the return object type can be two an array or object which in undesirable 
*/
async function Query_Database(params,findOne,callBack,projection = {_id: 1, "Steam_Data":1}){
    const client = await MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect(async (err) => {
        const collection = client.db("cheaterDB").collection("players");  
        const entries = []
        findOne ? entries.push(await collection.findOne(params)) : await collection.find(params).project(projection).forEach((val)=>{entries.push(val)})
        callBack(findOne ? entries[0] :entries);      
        client.close();
      });
}


/** 
 * @todo Document function
 *  I think its valuable enough to rewrite this function properly not even sure what it does...   
 * Since its not used maybe we just remove it. 
*/
async function UpdateStandardDeviation(){
    const client = await MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect(async (err) => {
        const collection = client.db("cheaterDB").collection("players");  
        await collection.aggregate(
            [
              {
                $group:
                  {
                    _id: {$ne:['_id', null]},
                    generalDeviations:{
                        StandDev: { $stdDevPop: {$divide:["$Steam_Data.user_game_stats.general_stats.accuracy","$Steam_Data.user_game_stats.general_stats.accuracy"]} },
                        Mean : {$avg : "$Steam_Data.user_game_stats.general_stats.accuracy"}
                    }
                  }
              }
            ]
        ).forEach(async (val)=>{
            await collection.updateOne(
                {
                    _id: 'accuracy_standard_deviation'
                },
                {
                    $set:{'generalDeviations':val.generalDeviations}
                },
                {
                    upsert:true
                }
            );
        })
        client.close();
      });

}


/** 
 * @todo Document this function 
 * there is an array containing all of the gun ids (export that as a const in global state or somewhere else) 
 * One thing that I am noticing is that there is a Median_Abs_deviation object in the db in the same collection as players collection. Separate these two collections as they aren't the same type of data or used the same way. 
 * separate this function into the model file
 * remove the callback
*/
async function Update_Median_Absolute_Deviations(callback){
    /*
        Struct:
        {
            gunID: {
                median:#,
                median_absolute_deviation:#
            }
        }
        ^^^^
        median = median ( sorted array of all users gunID / users accuracy)
        median_absolute_deviation = median of sorted array of (abs((gunID / accuracy) - median))
        
    */
   const gunIDS = ['awp','ak47','aug','deagle','glock','elite','fiveseven','famas','g3sg1','p90','mac10','ump45','xm1014','m249','hkp2000','p250','sg556','scar20','ssg08','mp7','nova','negev','sawedoff','bizon','tec9','mag7','m4a1','galilar']
   const gun_median_deviations = [] // this array is filled with all of the arrays for each gun in the db , each players awp normalized in the first array, each players ak47 normalized in the second array, etc.. 
   const gun_absolute_deviations = {}; // for each gun there will be on object {MAD:#,MED:#} where MAD = Median absolute dev, MED = median,
   const updateObject = {
       _id: 'Median_Absolute_Deviation_Data',
       data:{}
   }
   await Get_All_User_Gun_Stats(val =>{
       val.forEach((data)=>{
            gunIDS.forEach((id,index)=> {
                if(!gun_median_deviations[index]){gun_median_deviations[index] = new Array(0)}
                gun_median_deviations[index].push((data['Steam_Data']['user_game_stats']['general_stats'][id]['normalized']))
            })
       }); 
       gun_median_deviations.forEach((arr,index)=>{
           arr.sort((a,b)=> a-b)
           let median = arr[Math.floor(arr.length/2+1)]// median value :: technically I should be catching the case where we have an even number of values and we take the mean of the middle two
           arr.map((val)=>Math.abs(val - median))
           arr.sort((a,b)=> a-b)
           let MAD = 1.4826 * arr[Math.floor(arr.length/2+1)]
           gun_absolute_deviations[gunIDS[index]] = {MED:median,MAD:MAD}
        })
        updateObject.data = gun_absolute_deviations;
        callback(updateObject); 
   })
}


/** 
 * @todo Remove this function 
 * as this helper function only does one thing there is no reason to have it. `WE CONVERTED A 1 LINER INTO A 1 LINER`
*/
async function Query_DB_By_SteamId(steamid,callBack){
    await Query_Database({_id:steamid},true,callBack)
}


/** 
 * @todo Document function
 * again we should remove the global payload object  
*/
async function Insert_All_Steam_Users_From_Payload(payload){
    let keys = Object.keys(payload);
    let playerArrayForInsertion = []
    keys.forEach((key)=>{
        playerArrayForInsertion.push({_id : key, 'Steam_Data': payload[key]})
    })
    const client = await MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect(async (err) => {
        const collection = client.db("cheaterDB").collection("players");
        for(let i = 0; i < playerArrayForInsertion.length;i++){
            const currentObject = playerArrayForInsertion[i]
            const inserted = await collection.updateOne({_id:playerArrayForInsertion[i]._id},{$set:currentObject},{upsert:true}); 
        }
        client.close();
      }); 
}


/** 
 * @todo Document this function 
 *  
*/
async function Delete_All_entries_From_Database(){
    const client = await MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect(async (err) => {
        const collection = client.db("cheaterDB").collection("players");
        const deleted = await collection.deleteMany({}); 
        client.close();
      }); 
}

/** 
 * @todo Remove this function  
*/
async function Get_Vac_Banned_Players_Steamids(callBack){
    await(Query_Database({"Steam_Data.user_vac_ban":false},false,callBack,{"Steam_Data":0}))
}


/** 
 * @todo Remove this function  
*/
async function Get_All_Steam_Ids_From_Database(callBack){
    await Query_Database({'Steam_Data':{$exists:true}},false,callBack,{"Steam_Data":0})
}


/** 
 * @todo Remove this function We should act on the collection directly 
*/
async function Update_One(updateVal){
    const client = await MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect(async (err) => {
    const collection = client.db("cheaterDB").collection("players");
        const inserted = await collection.updateOne({_id:updateVal._id},{$set:updateVal},{upsert:true}); 
    client.close();
  }); 
}


/** 
 * @todo document this function 
 * this function gets all of the users from the database and updates them after calling the steam api that many times
 * we might want to rewrite this function to make it more efficient 
*/
async function Update_All_Users(steamids){
    const numOfArrays = Math.ceil(steamids.length/100)
    console.log(numOfArrays); 
    for(let i = 0; i < numOfArrays; i++){
        const steamIdsToHundred = steamids.splice(i*100,(i+1) * 100).map((val)=>{return val._id})
        await handleSteamAPICalls(steamIdsToHundred)
        await Insert_All_Steam_Users_From_Payload(payload); 
        // await UpdateStandardDeviation(); 
    }
}


/** 
 * @todo Document this function 
 * This wrapper function calls all of the important functions regarding the steam_ids passed as a query param 
*/
async function handleSteamAPICalls(steamids){
    initializePayload(steamids); 
    await getUsersStatsFromGame(steamids);
    await getUsersData(steamids); 
    await getUsersSteamLevel(steamids); 
    await getUsersHoursPlayed(steamids); 
    await getUsersBanRecord(steamids)
    console.log('done executing steam api calls'); 
    // this method calls each api in order each after the last has completed...
}


/** 
 * @todo document function
 * This idea of having a payload that contains all of the user data is needed but is there a way to separate the needed data (for the database) and the non needed data (for the client)  
*/
function initializePayload(steamids){
    payload = {}
    payload['Median_abs_dev'] = {}
    steamids.forEach((val)=>{
        payload[val] = {
            'owned_game_data' : {},
            'user_data' : {},
            'steam_level': 0,
            'user_vac_ban':{},
            'user_ban_record':{},
            'user_game_stats':{},
        }; 
    })
}


/** 
 * @todo document function 
 * rename this function its more of a `setter` function so we could call it set...
*/
async function getUsersStatsFromGame(steamids){
    for(let i = 0; i < steamids.length; i++){
            payload[steamids[i]]['user_game_stats'] = await getUserStatsFromGame(steamids[i]); 
    }
}

/** 
 * @todo document function 
 * rename this function its more of a `setter` function so we could call it set...
*/
async function getUsersHoursPlayed(steamids){
    for(let i = 0; i < steamids.length; i++){
        if(!payload[steamids[i]]){payload[steamids[i]]={}}
        payload[steamids[i]]['owned_game_data'] = await getUserHoursPlayed(steamids[i]); 
    }
}

/** 
 * @todo document function 
 * rename this function its more of a `setter` function so we could call it set...
 * one thing to note is that this function only makes a single call to the STEAM WEB API. We need to maintain this aspect to avoid unnecessary calls 
*/
async function getUsersBanRecord(steamids){
    let arr = await getUserBanRecord(steamids); 
    arr.forEach((val)=>{
        let ID = val['SteamId']
        delete val['SteamId']
        let isVacBanned = val.VACBanned;
        delete val.VACBanned; 
        payload[ID]['user_vac_ban'] = isVacBanned; 
        payload[ID]['user_ban_record'] = val; 
    })
}

/** 
 * @todo document function 
 * This function calls a helper function that does some parsing of the response object, the parser is responsible for inserting into the payload which I think is bad design. 
 * rename this function its more of a `setter` function so we could call it set...
 * one thing to note is that this function only makes a single call to the STEAM WEB API. We need to maintain this aspect to avoid unnecessary calls 
*/
async function getUsersData (steamids){
    const URL = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&&steamids=${steamids}`
    const steamUsersData = await createRequest(URL); 
    parseUserData(steamUsersData,payload); 
}

/** 
 * @todo document function 
 * rename this function its more of a `setter` function so we could call it set...
*/
async function getUsersSteamLevel(steamids){
    for(let i = 0; i < steamids.length; i++){
        if(!payload[steamids[i]]){payload[steamids[i]]={}}
        payload[steamids[i]]['steam_level'] = {}
        payload[steamids[i]]['steam_level'] = await getUserSteamLevel(steamids[i])
    }
}


/** 
 * @todo document function
 * This function parses a response from the steam api and removes all sorts of useless tags and is responsible for storing each player in the payload. Remove that functionality 
*/
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


/** 
 * @todo document function
 * Remove the `createRequest` call replace with a library
 * Calls a parser function then returns the parsed data (weird cause most the time I dont return data but instead use a callback or insert data directly... Perhaps I was starting to get it) 
*/
async function getUserStatsFromGame(steamid){
    const URL = 'https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/'
    const appID = '000730'
    const steamUserStatsFromGameResponse = await createRequest(`${URL}/?key=${key}&steamid=${(steamid)}&appid=${appID}`)
    const parsedJSON = parseUserStatsFromGame(steamUserStatsFromGameResponse); 
    return parsedJSON; 
}

/** 
 * @todo Document function
 * removed unused vars 
 * perhaps there is a better method to parsing these response objects (maybe a schema validator or something) 
*/
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

/** 
 * @todo Document function
 * Seems like we could handle this without this method again using a schema validator type beat 
*/
function parseAchievments(ach){
    const achievmentCount = Object.keys(ach['playerstats']['achievements']).length;
    return achievmentCount; 
}

/** 
 * @todo Document function
 * Seems like we could handle this without this method again using a schema validator type beat 
*/
function parseSteamidFromUserStats(userStatsFromGame){
    return userStatsFromGame['playerstats']['steamID'];
}

/** 
 * @todo Document function
 * Seems like we could handle this without this method again using a schema validator type beat 
*/
function parseLastMatch(userStatsFromGame){
    const lastMatchData = {}; 
    Object.keys(userStatsFromGame['playerstats']['stats']).forEach((userStat)=>{
        if(userStatsFromGame['playerstats']['stats'][userStat].name.includes('last')){
            lastMatchData[userStatsFromGame['playerstats']['stats'][userStat].name] = userStatsFromGame['playerstats']['stats'][userStat].value; 
        }
    })
    return lastMatchData; 
}


/** 
 * @todo document function
 * This function again uses a large list of constant data we should extract into a global or somewhere else as a CONST 
 * this function also does the calculation to find normalized gun data so perhaps we could extract that functionality into a helper function because it does some calculation
*/
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
            normalized: total_hits_currentGun/total_shots_currentGun/generalMatchData['accuracy'],
            'shots_kill': total_shots_currentGun / total_kills_currentGun,
            'hits_kill' : total_hits_currentGun/total_kills_currentGun,
        }
        generalMatchData[gunIDS[i]] = currentGunStats
    }
    return generalMatchData; 
}


/** 
 * @todo function could easily be replaced with a find function 
*/
function getStatIndex(statsList,name){
    let statIndex = 0; 
    statsList.forEach((stat,index)=>{
        if(stat.name == name){
            statIndex = index; 
        }
    })
    return statIndex; 
}


/** 
 * @todo document function
 * calls a parser function perhaps we don't need that 
*/
async function getUserBanRecord(steamids){ // only call once with all steam ids 
    // const maxsteamids = 
    const maxSteamids = 100; 
    const URL = 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/'
    let response = await createRequest(`${URL}?key=${key}&steamids=${(steamids.slice(0,100))}`);
    return parseUserBanRecord(response); 
}

/** 
 * @todo we do not need this function  
*/
function parseUserBanRecord(res){
    return res['players']; 
}


/** 
 * @todo document function
 * calls a parser function perhaps we don't need that 
*/
async function getUserSteamLevel(steamid){
    const URL = 'https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/'
    const response = await createRequest(`${URL}?key=${key}&steamid=${(steamid)}`)
    return parseUserSteamLevel(response); 
}

/** 
 * @todo remove this function implement error handling in some other way 
*/
function parseUserSteamLevel(res){
    if(res['response']){
        return res['response']['player_level']
    }
    return {}; 
}


/** 
 * @todo document function
 * uses parser perhaps we don't need that 
*/
async function getUserHoursPlayed(steamid){
    const URL = 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/'
    console.log(steamid)
    const response = await createRequest(`${URL}?key=${key}&steamid=${BigInt(steamid)}&include_appinfo=false&include_played_free_games=true`);
    return parseHoursPlayed(response); 
}

/** 
 * @todo document function 
 * try to avoid using all parser functions in replacement with a json parser or schema validator  
*/
function parseHoursPlayed(res){
    if(res['response']['games']){
        const userGamesOwned = res['response']['game_count'];
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


/** 
 * @todo remove unused function 
*/
function parseSteamIDs(str){
    const splitBySpace = str.split(' '); 
    const steamIDs = splitBySpace.filter(val=>{
        return (val.includes('STEAM'))
    })
    return steamIDs; 
}

/** 
 * @todo remove unused function 
*/
function steamIDtosteam64(steamid){
    const parsed = steamid.split(':'); 
    const x = parsed[1]; 
    const y = parsed[2]; 
    return (BigInt(y) * 2n) + BigInt(x) + 76561197960265728n;
}

module.exports = router;
/*
    step 1 on POST: 
        parse the large string into the steamids,
        parse the steamids, convert into steam64ids
    step 2: 
        using the steam64ids call each steam api and fill the payload: 
            FORMAT:
            [UsersSteamID]:
                {
                    'owned_game_data' : {},
                    'user_data' : {},
                    'steam_level': 0,
                    'user_vac_ban':{},
                    'user_ban_record':{},
                    'user_game_stats':{},
                }
    step 3: 
        Insert / update players in the database
    step 4: 
        res.json(payload)
*/