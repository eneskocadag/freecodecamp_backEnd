const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose");
require('dotenv').config()
const mySecret = process.env['MONGO_URI']
mongoose.connect(mySecret);
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const defaultDate = () => new Date().toDateString();
// MONGODB SCHEMAS & MODELS
const logSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

const userSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [logSchema],
});

const Fitter = mongoose.model("Fitter", userSchema);
// POST TRANSACTIONS
app.post("/api/users", (req, res) => {
  let username = req.body.username;
  let yeniUser = new Fitter({
    username: username,
    count: 0,
  });
  yeniUser.save((err, savedData) => {
    if (!err && savedData != undefined) {
      res.json({ username: savedData.username, _id: savedData._id });
    }
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id || req.body._id; // userId from URL or from body
  let count = 0;
  const exObj = {
    description: req.body.description,
    duration: +req.body.duration,
    date: req.body.date || defaultDate()
  }; // exrecise object to add
  Fitter.find({ userId }, (err, findData) => {
    count = findData.count;
  })
  Fitter.findByIdAndUpdate(
    userId, // find user by _id
    { $push: { log: exObj }, $set: { count: count } }, // add exObj to exercices[]
    { new: true },
    function(err, updatedUser) {

      if (err) {
        return console.log('update error:', err);
      }
      let returnObj = {
        username: updatedUser.username,
        description: exObj.description,
        duration: exObj.duration,
        _id: userId,
        date: new Date(exObj.date).toDateString()
      };
      res.json(returnObj);
    }
  );
}
)

//GET TRANSACTIONS
app.get("/api/users", (req, res) => {
  Fitter.find((err, allUsers) => {
    if (!err && allUsers != undefined) {
      res.send(allUsers);
    } else res.send("Tüm kullanıcılar çekilirken hata oluştu.");
  }).select({ username: 1, _id: 1 });
})

app.get("/api/users/:_id/logs", (request, response) => {
  let gelenId = request.params._id;
  let queryNum = request.query;
  if (Object.keys(queryNum).length === 0) {
    Fitter.findOne({ _id: gelenId }, (err, findingData) => {
      if (!err && findingData != undefined) {
        findingData.count = findingData.log.length;
        findingData.save();
        response.json(findingData);
      } else {
        response.send("Log'u bulamadım");
      }
    })
  } else {
    Fitter.findById(gelenId, (error, result) => {
      if (!error) {
        let responseObject = result
        if (request.query.from || request.query.to) {
          let fromDate = new Date(0)
          let toDate = new Date()
          if (request.query.from) {
            fromDate = new Date(request.query.from)
          }
          if (request.query.to) {
            toDate = new Date(request.query.to)
          }
          fromDate = fromDate.getTime()
          toDate = toDate.getTime()
          responseObject.log = responseObject.log.filter((session) => {
            let sessionDate = new Date(session.date).getTime()
            return sessionDate >= fromDate && sessionDate <= toDate
          })
        }
        if (request.query.limit) {
          responseObject.log = responseObject.log.slice(0, request.query.limit)
        }
        responseObject = responseObject.toJSON()
        responseObject['count'] = result.log.length
        response.json(responseObject)
      }
    })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
