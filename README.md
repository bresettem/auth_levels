Authentication Levels:

Authentication Level-1: Register and Login with just a username and password.

Authentication Level-2:Register and Login with encrypted password with SECRET_KEY:

    Define a long string secret key either by using a random generation function or preferably manually at this stage.
    Create the pgcrypto Extension
    Alter the size of password column to VARCHAR(512) to make sure it will accommodate for the encrypted password
    Adjust the INSERT query in post register route to include the password encryption
    Adjust the post login route to include the decryption process to authenticate the user login credentials

Adding/ Configuring Environment Variables & gitignore
