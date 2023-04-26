const { json } = require('body-parser');
const models = require('../models');
const Table = models.Table;
const Player = models.Player;

//What methods should a table have?

//1. Join, when a player wants to join (They send their info, if you're in a game  add to the spectators)
//{
//2. Fold (A player send the message that they're out, refuse the message if they're the last player)
//3. Call (A player matches the current bet of the table)
//4. Raise (A player raises the current bet of the table)
//} -- These have been allocated to the player, who will send an update to the table when any of these happen
//5. Draw (Either the Table is drawing or a player is)
//6. NextHand (test if you should continue to the next hand)
//7. NextTurn (test if you should continue to the next turn)

const createTable = async (req,res) => {
    const tableData = {
        name: "table1",
        pot: 0,
        curBet: 0,
        players: [],
        spectators: [],
        inGame: false,
        hand: [],
    }
    const newTable = new Table(tableData);
    newTable.save();
    return res.json({redirect: '/maker'});
}

const shuffle = () =>{
    //Order: Diamond, Heart, Spade, Clover (meaning 13 is the Diamond king while 52 is the clover king)
const perfectDeck = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16
,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37
,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52];
const resultDeck = [];
//Returns between
for(let i = 52;i>0;i--){ 
    //start at 52, get to 1
    const index = Math.floor(Math.random()* i);
    //Each iteration, remove one random item from an array and shorten the array
    resultDeck.push(perfectDeck[index]);
    perfectDeck.splice(index,1);
}
return resultDeck;
}

const draw = async (req,res,fromTable) =>{
    //The request has a player, and a table
    const jTable = await Table.find({name: {$eq: req.table}});
    const jdeck = jTable.deck

    if(fromTable){
        //if the request is from the table, handle differently
        await Table.update({name: {$eq: req.table}},
            {$push: {
                hand: jdeck.pop()
            }});

        //TODO:
        //If the table is drawing that means its the next turn
        //So reset every players decisions (except for those that went all in)




    }else{
        //Get the array of all the players names
        const pArr = jTable.players;

        //Now pop 2*(number of players) cards from the table deck
        let tempHand = [];
        for(let i=0;i<pArr.length;i++){
            tempHand.push(jdeck.pop());
            tempHand.push(jdeck.pop());

            await Player.update(
                {name: {$eq: pArr[i]}},
                {$set: {
                    hand: tempHand
                }});
            tempHand = [];
        }
        //Now each player has had their hand stocked, and the deck lost what it needed to 
        //Make sure to set the tables deck back to its new state

        await Table.update(
            {name: req.table},
            {$set: {
                deck: jdeck
            }}
        );
    }
    //Pop a card from the tables deck, add it to the players hand, repeat
    //if the request is from the table, that means the table is drawing, pop from the deck push to the 'hand' of the table

}

//This checks if we should move to the next Turn or the next hand
const NextCheck = async (req,res) => {
    //Go through each player
    //If each player (that has the decision 'call' or 'raise') has a bet that equals the table bet then continue into next Turn
    //if the player has the decision 'all' their bet doesn't need to be matching the tables
    //You don't need to account for 'fold' decisions because those are removed from the 'players' list beforehand
    //Get the players
    let con = true;
    const jTable = await Table.find({name: {$eq: req.table}});
    const Tbet = jTable.curBet;
    const pArr = jTable.players;
    let pBet = 0;
    let p;

    if(pArr.length == 1){
        //Folded players are removed until the next hand so if theres only one player, they won!
        //Skip to payout, index can be set to 0 because they'll be alone
        payout(req,res,jTable,0);
    }

    for(let i=0;i<pArr.length;i++){
         p = await Player.find({name: {$eq: pArr[i]}});
         pBet = p.bet;
        if(pBet != Tbet && p.decision != 'all'){
            con = false;
        }
    }


    if(con){
        NextTurn(req,res,jTable);
    }

}

const NextHand = async (req,res) => {
    //With each hand, shuffle the deck, and save the result to the deck attribute of table

    await Table.update(
        {name: {$eq: req.name}},
        {
            $set: {
                deck: shuffle(),
                inGame: true
            }
        },
    );
    //Then make each player draw
    draw(req,res,false);

    //The player first on the players list has to ante, the player who hits the "Ready" button first is added to the players list first
    //TODO
}

const NextTurn = async (req,res, jTable) => {
    //If this is called, everyone is ready for the next round
    const l = jTable.hand.length;
    if(jTable.hand.length = 0){
        draw(req,res,true);
        draw(req,res,true);
        draw(req,res,true);
    }

    switch(l){
        case 0:
            draw(req,res,true);
            draw(req,res,true);
            draw(req,res,true);
            break;
        case 3:
        case 4:
            draw(req,res,true)
            break;

        case 5:
        //The round is over, check who won
        WinCheck(req,res,jTable);
    }



}

const WinCheck = async (req,res,jTable) => {
    //When checking for wins, go through each player individually
    //Take the 7 cards that they can combine (the two from their hand the 5 from the table)
    //Check for the highest hand first, see if there are 5 of one suit
    Thand = jTable.hand;
    let Phand;
    let PArr = [];
    for(let i=0;i<jTable.players.length;i++){
        Phand = await Player.find(
            {name: {$eq: `${jTable.players[i]}`}}
            ).hand;
            //Save each "best hand" for each player into a new array
            pArr.push(bestHand(Phand.concat(Thand)));
    };
    //Now the Parr contains all the best hands of each player, it's also in order
    //So 
    let bestIndex = 0;
    let comparison = {
        "hSuit": 999,
        "hNum": -999,
        "rank": 999,
    };
    let cur;
    for(let i=0;i<pArr.length;i++){
        cur = PArr[i];
        if(cur.rank < comparison.rank){
            bestIndex = i;
            comparison = cur;
        }else if(cur.rank == comparison.rank && cur.hNum > comparison.hNum){
            bestIndex = i;
            comparison = cur;
        }else if(cur.rank == comparison.rank && cur.hNum == comparison.hNum && cur.hSuit < comparison.hSuit){
            bestIndex = i;
            comparison = cur;
        }
    };
    //Now comparison is the best hand and bestIndex is the index of player
    payout(req,res,jTable,bestIndex);
}

const payout = async (req,res,jTable,bestIndex) => {
    let p = await Player.find({name:{$eq: jTable.players[bestIndex]}});
    let playerlist = (await Table.find({name:{$eq: jTable.name}})).players;
    //Add the pot to the winning players chips
    p.chips += jTable.pot;
    jTable.pot = 0;
    jTable.curBet = 0;
    jTable.deck = shuffle();
    jTable.inGame = false;
    //Clear the bets of all players
    //Clear the decisions of all players
    //DONT clear the hands, people wanna see what happened, create ready/unready function like blackjack

    for(let i=0;i<playerlist.length;i++){
        await Player.update(
            {name: {$eq: playerlist[i]}},
            {$set: {bet: 0, decision: 'unready'}});
    };

    await Table.update(
        {name: {$eq: jTable.name}},
        {$set: {
            pot: jTable.pop,
            curBet: jTable.curBet,
            deck: jTable.deck,
            inGame: jTable.inGame,
        }}
        );


}

const bestHand = (Arr) => {
    //Arr is an array of cards, each one represented by a number between 1-52
    //1 being the Ace of Diamonds, 52 being the King of Clovers
    //If the number is between 1-13 it's diamonds, 14-26 is Hearts, 27-39 Spades, 40-52 is Clovers
let result = {
    "hSuit": 0,
    "hNum": 0,
    "rank": 0
}

    let jsonR = {
    "D": 0,
    "H": 0,
    "S": 0,
    "C": 0,
    "Dp": [],
    "Hp": [],
    "Sp": [],
    "Cp": [],
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    "6": 0,
    "7": 0,
    "8": 0,
    "9": 0,
    "10": 0,
    "11": 0,
    "12": 0,
    "13": 0,
}

for(let i=0;i<Arr.length;i++){

    switch(Arr[i]%13){
        case 1:
            jsonR["1"]++;
            break;
        case 2:
            jsonR["2"]++;
            break;
        case 3:
            jsonR["3"]++;
            break;
        case 4:
            jsonR["4"]++;
            break;
        case 5:
            jsonR["5"]++;
            break;
        case 6:
            jsonR["6"]++;
            break;
        case 7:
            jsonR["7"]++;
            break;
        case 8:
            jsonR["8"]++;
            break;
        case 9:
            jsonR["9"]++;
            break;
        case 10:
            jsonR["10"]++;
            break;
        case 11:
            jsonR["11"]++;
            break;
        case 12:
            jsonR["12"]++;
            break;
        case 13:
            jsonR["13"]++;
            break;
    }

    if(Arr[i]<14){
        jsonR.D++;
        jsonR.Dp.push(Arr[i]);
    }else if(Arr[i]<27){
        jsonR.H++;
        jsonR.Hp.push(Arr[i]);
    }else if(Arr[i]<40){
        jsonR.S++;
        jsonR.Sp.push(Arr[i]);
    }else{
        jsonR.C++;
        jsonR.Cp.push(Arr[i]);
    }
}
//If any of these are 5, you at least have a flush!
//Since having 5 of one suit is mutually exclusive (you cant have 5 of one and 5 of another in a 7 card game)
// I can use if/else statements to speed this up
//Sort naturally does things in ascending order
//Once they're sorted, see if they chain together, if they do, that's a straight/royal flush
//if they don't it's a normal flush
let flush = false;
if(jsonR.D >= 5){
    //No else statements necessary since we'll just return once we find the best hand
    jsonR.Dp.sort();
    if(checkRoyal(jsonR.Dp)){
        //If you have a royal flush, the high card is a given
        //and since we check by suit already, the suit is given
        //And the rank is 1 since this is the best hand in the game
        result.hSuit = 1;
        result.hNum = 14;
        result.rank = 1;
        return result;
    }

    const f = checkFlush(jsonR.Dp);
    if(f.stat){
        //if you have a straight flush
        //The suit is a given
        result.hSuit = 1;
        //The number is not given but was already calculated
        result.hNum = f.high;
        //and the rank is given
        result.rank = 2;
        return result;
    }

    //If you have neither a royal nor a straight flush but you DO have a flush
    //It will be saved temporarily in the result but since it's actually outranked by things that are checked later,
    // it won't be used  until necessary
    result.hSuit = 1;
    result.hNum = f.high;
    result.rank = 5;

}else if(jsonR.H >= 5){
    jsonR.Hp.sort();

}else if(jsonR.S >= 5){
    jsonR.Sp.sort();

}else if(jsonR.C >= 5){
    jsonR.Cp.sort();

};    

//Assume you don't have 4 of a kind
let four = false;
//A full house requires a three of a kind + two of a kind
//The high card is considered whichever one is the 3 of a kind
//I'm not accounting for suit calls in cases this rare
let FH = {
    "three": 0,
    "two": 0,
}
//Right below this is four of kind, which is much easier to check for
for(let i=1;i<14;i++){
    
    //turn i into a template string and iterate using that through the json object for the corresponding card
    //If you have  4 of a kind by definition you have all the suits so just default to the highest one
    if(jsonR[`${i}`] == 4){
        four = true;
        result.hNum = i;
        result.hSuit = 1;
        result.rank = 3;
    }else if(jsonR[`${i}`] == 3){
        FH.three = i;
    }else if(jsonR[`${i}`] == 2){
        FH.two = i;
    }
    
    
};
if(four){
    return result;
}else if(FH.three != 0 && FH.two != 0){
    result.rank = 4;
    result.hSuit = 1;
    result.hNum = FH.three;
    return result;
};

//Now to check for a straight, rank 6
//A straight is any combination of cards regardless of suit that form 5 in a row
const s = checkStraight(arr);


if(s.stat){
    return result;
}

//Right below that is 3 of a kind, again, fairly easy to check for
let three = false;
for(let i=1;i<14;i++){
    if(jsonR[`${i}`] == 4){
        three = true;
        result.hNum = i;
        result.hSuit = 2;
        result.rank = 7;
    }
};

if(three){
    return result;
}

//Now check for two pair
let TP = {
    "a": 0,
    "b": 0,
}

for(let i=1;i<14;i++){
    if(jsonR[`${i}`] == 2){
        TP.b = TP.a;
        TP.a = i;
    }else if(jsonR[`${i}`] == 1){
        //Save the highest one you find
        //if you find 2 pair or one pair the result will be overwritten anyway
        result.rank = 10;
        result.hNum = i;
        result.hSuit = 4;
    }
};

if(TP.b != 0){
    result.hNum = Tp.a;
    result.hSuit = 4;
    result.rank = 8;
    return result;
}else if(Tp.a != 0){
    //If B is 0 but a is not, you actually have 1 pair
    result.hNum = Tp.a;
    result.hSuit = 3;
    result.rank = 9;
    return result;
}


//Failing all that, just take the highest card
return result;

};

const checkStraight = (arr) => {
let s = {
    "stat": false,
    "chain": 1,
    "high": 0,
}
//The problem with a straight is it can be mixed and all the cards are represented by numbers greater than 13
arr.sort();
//Now the array is in order,
//Check the first spot

//Logic test: 1,3,4,5,8,15
//First one passes, The second one does as well but thats a problem
//Because its essentially going 
//I have 1, I have 15, which is the 2 in a different suit
//And also 28, 2 in yet another suit
//15 should also connect to 3, which is 12 behind it
//28 connects to 3 too, which is 25 behind it
//But now I need to switch, I can't just iterate because it doesn't work like that anymore
//I now need to chain off the different suit two

//This is deeply inefficient but it's the only way I see this working
for(let i=0;i<arr.length;i++){
    recursiveStraight(arr,s,arr[i]);
    if(s.chain >= 5){
        result.hNum = s.high;
        result.rank = 6;
        result.hSuit = 4;
        s.stat = true;
    }
};

};
const recursiveStraight = (arr,s,next) => {
    //If there is a next
    let n = arr.find(k => k == next+1 || k ==next+14 || k == next+27 || k == next+40 || k == next-14 || k == next-25 || k == next-37);
    if(n){
        //Increase the chain, and go off of that
        s.chain++;
        s.high = n%13;
        recursiveStraight(arr,s,n);
    }else if(s.chain <= 4){
        s.chain = 0;
        s.high = 0;
    }
    return s;
};

const checkFlush = (arr) => {
    let f = {
        "stat": true,
        "chain": 1,
        "high":0
    };
    //unfortunately this needs to account for the case where the player may actually have 6 or 7 cards of the same suit (beyond improbable)

    //So something like this needs to be accounted for: 1,5,10,11,12,13
    //Where a middle card interrupts an otherwise royal flush
    //Or something like 1,8,9,10,11,12,13
    //Where 2 middle cards actually form a second flush and a royal flush is also present
    //This case I'm not accounting for because who ever got it has clearly made a pact with satan and deserves no payout
    for(let i=0;i<arr.length-1;i++){
            if(arr[i]+1 != arr[i+1]){
                f.chain++;
                if(chain >= 5){
                    f.high = arr[i+1]%13;
                };
            }else if(chain <= 4){
                f.chain = 0;
                f.stat = false;
            }
    }

    return f;
};

const checkRoyal = (arr) => {
    if(arr[0]%13 != 1){
        return false;
    }
    //Since the array passed in is already organized by suit we don't have to worry about a mix n match scenario with the OR statements
    //We don't, however, have any idea which suit was passed in, so the values could vary, account for that
    if(arr.find(k => k==10 || k == 23 || k==36 || k==49) 
    && arr.find(k => k==11 || k == 24 || k==37 || k==50)
    && arr.find(k => k==12 || k == 25 || k==38 || k==51)
    && arr.find(k => k==13 || k == 26 || k==39 || k==52)){
        return true;
    }
};
const join = async (req,res) => {

    //If you can find a table with the name from the request, then the player is trying to join an existing table
    //It shouldn't be possible to join a nonexistent one but prepare for everything
    //The requests 'table' property is the name of the table they're trying to join
    jTable = await Table.find({name: {$eq: req.table}});
    if(jTable){

        const data = {
            name: req.name,
            chips: req.chips,
            bet: 0,
            hand: [],
        }

        let p = await Player.find({name: {$eq: req.name}})
        if(p){
            //If the player exists, continue as normal
        }else{
            //if the player does not exist, create the player
            const data = {
                name: req.name,
                chips: req.chips,
                bet: 0,
                hand: [],
            }
            const newPlayer = new Player(data);
            await newPlayer.save();

        }
        //The table exists, now what?
        //Well if it's in a game then add the player(their name at least) to spectators
        if(jTable.inGame){
            
            await Table.find({}).updateOne(
                {name: {$eq: req.table}},
                { $push: {spectator: data.name}   }
            );

        }else{
            await Table.find({}).updateOne(
                {name: {$eq: req.table}},
                { $push: {players: data.name}   }
            );


            //If there are at least 2 players, the game can start
            if(jTable.players.length > 1) {
                NextHand();
            }
        }
        return res.json({redirect: '/table'});

    }else{
        createTable();
    }
};


module.exports = {
    join,
    createTable,
    NextCheck,
    NextHand,
}