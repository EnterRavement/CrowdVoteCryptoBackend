const db = require("../models");

// async function getVotesfromDB() {
//   let votes2 = await db.Votes.find()
//     .sort({ _id: -1 })
//     .limit(1);

//   votes = votes2[0].votes;
// }
// getVotesfromDB();

// exports.handleVoting2 = async function(req, res, next) {
//   try {
//     if (typeof votes[req.body.symbol] === "undefined") {
//       votes[req.body.symbol] = {
//         voteScore: req.body.amount,
//         voteCount: 1,
//         voteResult: req.body.amount
//       };
//     } else {
//       let score = votes[req.body.symbol].voteScore + req.body.amount;
//       let count = votes[req.body.symbol].voteCount + 1;
//       let result = score / count;

//       result = +result.toFixed(2);
//       votes[req.body.symbol] = {
//         voteScore: score,
//         voteCount: count,
//         voteResult: result
//       };
//     }
//     db.Votes.create({
//       votes: votes
//     });
//     return res.status(200).json(votes);
//   } catch (err) {
//     return next(err);
//   }
// };
exports.getVotes = async function(req, res, next) {
  try {
    let votes = {};
    let dbVotes = await db.Votes.find();
    // dbVotes = dbVotes.filter(vote => {
    //   // console.log(vote.createdAt > new Date() - 24 * 60 * 60 * 1000);
    //   return vote.createdAt > new Date() - 48 * 60 * 60 * 1000;
    // });
    await dbVotes.forEach(voteObj => {
      if (votes[voteObj.symbol] === undefined) {
        votes[voteObj.symbol] = {
          voteScore: voteObj.vote,
          voteCount: 1,
          voteResult: voteObj.vote
        };
      } else {
        votes[voteObj.symbol].voteScore += voteObj.vote;
        votes[voteObj.symbol].voteCount += 1;
        votes[voteObj.symbol].voteResult = (
          votes[voteObj.symbol].voteScore / votes[voteObj.symbol].voteCount
        ).toFixed(2);
      }
    });

    return res.status(200).json(votes);
  } catch (err) {
    return next(err);
  }
};

// exports.handleVoting2 = async function(req, res, next) {
//   try {
//     let newVote = db.Votes.create({
//       vote: req.body.amount,
//       symbol: req.body.symbol
//     });
//     return res.status(200).json(newVote);
//   } catch (err) {
//     return next(err);
//   }
// };

exports.handleVoting = async function(req, res, next) {
  try {
    let lastvote;
    if (req.body.id !== "IP") {
      lastvote = await db.User.findById(req.body.id);
      let Ipuser = await db.ipUser.findOne({ ip: req.clientIp });

      if (
        Ipuser !== null &&
        Ipuser.voted[req.body.symbol] > new Date() - 12 * 60 * 60 * 1000
      ) {
        console.log("Vote failed, because user already voted without account");
        return res.json("VoteFailed");
      }
    } else {
      lastvote = await db.ipUser.findOne({ ip: req.clientIp });
      if (lastvote === null) {
        lastvote = await db.ipUser.create({
          ip: req.clientIp,
          voted: {}
        });
      }
    }
    // console.log(lastvote.voted[req.body.symbol]);
    if (
      lastvote.voted[req.body.symbol] === undefined ||
      lastvote.voted[req.body.symbol] < new Date() - 12 * 60 * 60 * 1000
    ) {
      let newVote = await db.Votes.create({
        vote: req.body.amount,
        symbol: req.body.symbol
      });
      if (req.body.id === "IP") {
        await db.ipUser.findOneAndUpdate(
          { ip: req.clientIp },
          {
            voted: { ...lastvote.voted, [req.body.symbol]: new Date() }
          }
        );
      } else {
        await db.User.findByIdAndUpdate(req.body.id, {
          voted: { ...lastvote.voted, [req.body.symbol]: new Date() }
        });
      }

      console.log("Vote succeeded");
      return res.status(200).json(newVote);
    } else {
      console.log("Vote failed");

      return res.json("VoteFailed");
    }
  } catch (err) {
    console.log("vote failed and caught");
    return res.status(501).json("Problem with Voting");
    return next(err);
  }
};
