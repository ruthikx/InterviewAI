require("dotenv").config()
const { execSync } = require("child_process")
const app = require("./src/app")
const connectToDB = require("./src/config/database")

// Install Chrome at runtime
console.log("Installing Chrome...")
execSync("npx puppeteer browsers install chrome", { stdio: "inherit" })
console.log("Chrome installed!")

connectToDB()

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})