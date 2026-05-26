const mongoose = require("mongoose")

async function connectToDB(params) {
    try{
        await mongoose.connect(process.env.MONGO_URI)

        console.log("Connected to Database")
    }catch(e){
        console.log(e)
    }
}

module.exports = connectToDB