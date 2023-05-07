
const models = require('../models');
const Player = models.Player;
const Table  = models.Table;
const io = require('../io');
const tController = require('./Table.js');

//The player can fold/call/raise
//They can also add funds to their account

//Fold will change your decision to "fold", that's all it does so the table can read your actions correctly
//Call will check the bet of the table, your current bet, and up it if necessary, taking the amount away from your chips
//If your Call would actually put you in the negative chips, meaning you technically don't have enough to call, that's allowed! you go "all in" and your decision changes to that
//If you Raise, then the table receives your possible raise amount and changes it's current bet, once you raise you can't raise again (but you can call if someone else raises)

//So here are the states

//Undecided --> Fold, Call, Raise
//Fold--> Nothing
//Call --> Call (if the bet is raised again), All in (if you call with insufficient chips), Fold
//Raise --> Call (if the bet is raised higher), All in (same as above), Fold
//All in --> nothing, automatically call everything

//At the end of each of these decisions, ping the table to see if you should continue to the next turn

const test = async (req,res) => {
    debugger;
    switch(req.body.decision){
        case 'call':
            call(req,res);
            break;
        case 'raise':
            raise(req,res);
            break;
        case 'fold':
            fold(req,res);
            break;
        case 'ready':
            ready(req,res)
            break;

    }
};
const getPlayer = async (req,res) => {
    const r = await Player.findOne({name: {$eq: req.body.name}}).lean();
    return res.json({player: r});
}

const ready = async(req,res) => {
    //No changes to the table are happening
    //Players bets, decisions, and chips have all been accounted for
    //Their hands will be reset once the next part begins
    await Player.findOneAndUpdate(
        {name: {$eq: req.body.name}},
        {
            $set: {
                decision: 'ready',
            }
        }
    );
    tController.NextReadyCheck();
}

const call = async (req,res) => {
    jTable = await Table.findOne({name: {$eq: req.body.table}}).lean();
    p = await Player.findOne({name: {$eq: req.body.name}}).lean();
    //First, check the current tables bet
    const Tbet = jTable.curBet;
    const Pbet = req.bet;
    let dif = Tbet-Pbet;
    let Pchips = p.chips;
    let decide = 'call';
    //Then check your bet, make sure it is lower
    if(Tbet > Pbet){
        //Then subtract the difference from your total chips, if the amount is negative, set it to 0 and set decision to all in
        Pchips -= (dif);
        if(Pchips <= 0 ){
            decide = 'all';
            //This will make sure it all equals out
            //For example the table bet is upped from 3 to 10
            //You have 3 chips in bet and 5 in reserve
            //So if you call, you only actually add 5 to the pot
            //dif = 7
            //and Pchips = -2
            //So the new dif is 5, which will be added to the total pot
            dif = dif+Pchips;
            Pchips = 0;
        }
    }
    //The only things that can change are your total chips, your current bet and your decision, update those
    await Player.findOneAndUpdate(
        {name: {$eq: req.body.name}},
        {
            $set: {
                decision: decide,
                chips: Pchips,
                bet: Tbet
            }
        }
    );

    await Table.findOneAndUpdate(

        {name: {$eq: req.body.table}},
        {
            $inc: {
                pot: dif
            }
        }
    );

    tController.NextCheck();

};

const raise = async (req,res) =>{

    //First get your current bet
    //Then the new bet sent with the request
    //Then get the tables bet
    //Confirm that your new bet is higher than the current table bet
    //If it is, alter the tables bet, and send out a ping using socket so all the other players know
    jTable = await Table.findOne({name: {$eq: req.body.table}});
    p = await Player.findOne({name: {$eq: req.body.name}});
    
    //betR is the new amount you're setting as your bet
    let betR = req.body.bet;
    let Tbet = jTable.curBet;
    let pBet = p.bet;
    let pChips = p.chips;
    let decide = 'raise';

    //As long as betR is larger than your current bet and the tables bet than your request to raise makes sense
    if(betR > pBet|| betR > Tbet){
        //Subtract the amount you're raising by from your Chips
        Pchips-= (betR - pBet);
        //Since you can't raise above your amount of chips you only need to account for the 0 case
        if(pChips == 0){
            decide = 'all';
        }
        //Since you're raising, your bet is higher than other bets, meaning the table bet is now equivalent to yours
        //Everyone needs to match it or go all in to keep playing
        Tbet = betR;
        await Table.update(
            {name: {$eq: req.body.table}},
            {
                $set: {
                    curbet: Tbet
                },
                $inc: {
                    pot: (Tbet-pBet)
                }
            }
        );
        
        await Player.findOneAndUpdate(
            {name: {$eq: req.body.name}},
            {
                $set: {
                    decision: decide,
                    chips: Pchips,
                    bet: betR
                }
            }
        );
        tController.NextCheck();
    }


};

const fold = async (req,res) => {

//If you fold, your decision is set to fold, you are removed from the players list and put into the spectators list
//Your bet is left in the pot 
p = await Player.findOne({name: {$eq: req.body.name}});

await Player.findOneAndUpdate(
    {name: {$eq: req.body.name}},
    {
        $set: {
            decision: 'fold',
            bet: 0,
            hand: [],
        }
    }
);


await Table.update(
    {name: {$eq: req.body.name}},
    {
        $pull: {
            players: {$in: [req.body.name]},
        }
    }
);

await Table.update(
    {name: {$eq: req.body.table}},
    {
        $push: {
            spectators: req.body.name
        }
    }
    )
    tController.NextCheck();
}

module.exports = {
    getPlayer,
    test
};