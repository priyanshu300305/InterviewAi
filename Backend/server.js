require("dotenv").config();

const app = require("./src/app");
const connectToDB = require("./src/config/database");

connectToDB();

// // TO RUN THE SERVER LOCALLY, UNCOMMENT THE FOLLOWING LINES AND COMMENT OUT THE EXPORT STATEMENT BELOW

// app.listen(3000, () => {
//     console.log("Server is running on port 3000")
// })


const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;