
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const photoSchema = new Schema({
  title:{
    type:String,
    require:true
  },
  description:{
    type:String,
    require:true,
  },
  photo:{
    type:String,
    require:true
  },
  username:{
    type:String,
    require:true,
  },
  userId:{
    type:String,
    require:true
  },
});
module.exports = mongoose.model("Photo",photoSchema)