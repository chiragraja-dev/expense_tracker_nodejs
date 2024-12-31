const { generateToken,
    hashedPassword,
    checkIfUserExist,
    createUser, verifyPassword } = require('../utils/authUtils')

const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password)
        return res.status(400).json({ error: 'fullName, email, password are required' })
    try {
        if ((await checkIfUserExist(email).length) > 0) {
            return res.status(400).json({ error: 'user already exists' })
        }
        const hashPassword = await hashedPassword(password)
        const userId = await createUser(fullName, email, hashPassword)

        const payload = { id: userId, email };
        const token = generateToken(payload);

        res.status(201).json({
            message: `Signup successful for email: ${email}`,
            token,
        })
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const login = async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ error: " Email and Password required" })
    }
    try {
        const usersRaw = await checkIfUserExist(email)
        if ((usersRaw?.length) === 0) {
            return res.status(400).json({ error: 'user not exist' })
        }
        console.log(usersRaw)
        const isAuthorized = await verifyPassword(password, usersRaw[0].password)
        if (!isAuthorized) {
            return res.status(400).json({ error: 'Invalid password' });
        }
        const payload = { id: usersRaw[0].id, email: usersRaw[0].email };
        const token = generateToken(payload);

        res.status(201).json({
            message: `Login successful `,
            email: usersRaw[0].email,
            name: usersRaw[0].fullName,
            token,
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "internal server error" })
    }


}

module.exports = { signup, login };