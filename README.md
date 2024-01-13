Authentication Levels:

Authentication Level-1: Register and Login with just a username and password.

Authentication Level-2:Register and Login with encrypted password with SECRET_KEY:

    Define a long string secret key either by using a random generation function or preferably manually at this stage.
    Create the pgcrypto Extension
    Alter the size of password column to VARCHAR(512) to make sure it will accommodate for the encrypted password
    Adjust the INSERT query in post register route to include the password encryption
    Adjust the post login route to include the decryption process to authenticate the user login credentials

Adding/ Configuring Environment Variables & gitignore

Authentication Level-3:Register and Login using password hashing with md5:

1. Install crypto-js (npm i crypto-js) and require crypto-js
2. Remove the Encryption and calling the SECRET_KEY from Register and Login routes and replace them with hashing the password using SHA256 function for better encryption

Authentication Level-4:Register & Login using password hashing/ salting with bcrypt:

1. Install bcrypt (npm i bcrypt) and require bcrypt. If you face any issue in installation, refer to the GITHUB repos of NPM to search the solution.
2. Define the number of salt rounds: const saltRound = 10
3. Remove the usage of MD5 from require, Register and Login routes and replace them with the bcrypt hashing/salting function as detailed in the code.

Authentication Level-4:Register & Login using password hashing/ salting with bcrypt:

1. Install bcrypt (npm i bcrypt) and import bcrypt. If you face any issue in installation, refer to the GITHUB repos of NPM to search the solution.
2. Define the number of salt rounds: const saltRound = 10
3. Remove the usage of MD5 from import, Register and Login routes and replace them with the bcrypt hashing/salting function as detailed in the code.

Authentication Level-5: Using passport, express-session & sequelize to add Cookies & sessions to insure authenticate and de-authenticate users credentials with starts and expiries of users login sessions and server restarts:

1. Installing & importing the relevant packages express-session, passport, passport-local, sequelize & connect-flash.
2. Set up & initialize the session including the cookies properties.
3. Set Up Sequelize and create User Model with PostgreSQL
4. Initialize and start using passport
5. Configure Passport Local Strategy.
6. Update register and login routes.
7. Adding Secret Route and Logout Route.
