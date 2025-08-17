const mongoose =require('mongoose')

const studentSchema = new mongoose.Schema({
        uid:String,
        password:String,
}
)

const studentModel= mongoose.model("student",studentSchema)
module.exports= studentModel