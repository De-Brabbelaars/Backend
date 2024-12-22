import passport, { strategies } from "passport";
import { Strategy } from "passport-local";
import { MockUsers } from "../utils/constants.mjs";


passport.serializeUser((user, done) => {
    done(null, user.id)
});


passport.deserializeUser((id, done) => {
    try {
        const finduser = MockUsers.find((user => user.id === id));
        if (!finduser) throw new Error("User not found");
        done(null, finduser);
    } catch (err) {
        done(err, null);
    }
})

export default passport.use(
    new Strategy((username, password, done) => {
        try {
            const finduser = MockUsers.find((user) => user.username === username);
            if (!finduser) throw new Error("user not found");
            if (finduser.password !== password)
                throw new error ("invalid credentials");
            done(null, finduser);
        }  catch (err) {
            done(err, null);
        }
    })
);