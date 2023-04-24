const requiresLogin = (req,res,next) => {
    if(!req.session.account) {
        return res.redirect('/');
    }
    return next();
}

const requiresLogout = (req,res,next) => {
    if(req.session.account) {
        return res.redirect('/maker');
    }
    return next();
}

const requireSecure = (req,res,next) => {
    if(req.headers['x-forwarded-proto'] !== 'http') {
        return res.redirect(`http://${req.hostname}${req.url}`);
    }
    return next();
}
const bypassSecure = (req,res,next) => {
    next();
}

module.exports.requiresLogin = requiresLogin;
module.exports.requiresLogout = requiresLogout;

if(process.env.NODE_ENV === 'production'){
    module.exports.requireSecure = requireSecure;
}else{
    module.exports.requireSecure = bypassSecure;
}