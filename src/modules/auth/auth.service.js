const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Handles registration and login: hashing/checking passwords and
 * issuing JWTs. Talks to the database only through AuthRepository.
 */

class AuthService{

    constructor(authRepository){
        this.authRepository = authRepository;
    }

    /**
     * Registers a new member account. Rejects the email if it's
     * already taken, then hashes the password before storing it.
     */

    async registerUser(userData){

        const{
            firstName,
            lastName,
            email,
            password
        } = userData;

        const existingUser = await this.authRepository.findUserByEmail(email);

        if(existingUser){
            throw new Error("Email is Alredy Registered.");
        }

        const hashedPassword = await bcrypt.hash(password,12);

        const userID = await this.authRepository.createNewUser({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        return await this.authRepository.findUserById(userID);
    }

    /**
     * Verifies credentials and, if they're valid, issues a signed
     * JWT carrying the user's ID and role for later auth checks.
     */
    
    async loginUser(email,password){

        const user = await this.authRepository.findUserByEmail(email);

        if(!user){
            throw new Error("Invalid Email or Password");
        }

        const passwordMatch = await bcrypt.compare(password,user.password);
        
        if(!passwordMatch){
            throw new Error("Invalid Password.");
        }

        const token = jwt.sign(
            {
                userID: user.userID,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn:process.env.JWT_EXPIRES_IN
            }
        );

        return {
            user :{
                userID: user.userID,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status
            },
            token
        };
    }

}

module.exports = AuthService;