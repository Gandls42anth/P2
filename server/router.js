const controllers = require('./controllers');
const mid = require('./middleware');
const router = (app) => {
    app.get('/login', mid.requireSecure,mid.requiresLogout,controllers.Account.loginPage);
    app.post('/login', mid.requireSecure,mid.requiresLogout,controllers.Account.login);

    app.get('/signup', mid.requireSecure,mid.requiresLogout,controllers.Account.signupPage);
    app.post('/signup', mid.requireSecure,mid.requiresLogout,controllers.Account.signup);

    app.get('/logout',mid.requiresLogin,controllers.Account.logout);
    app.get('/maker',mid.requiresLogin,controllers.Domo.makerPage);
    app.post('/maker',mid.requiresLogin,controllers.Domo.makeDomo);
    app.get('/', mid.requireSecure,mid.requiresLogout,controllers.Account.loginPage);

    app.post('/table', controllers.Table.join);
    app.get('/table',controllers.Account.tablePage);
    app.post('/tableUpdate',controllers.Table.getTheTable);
    app.post('/getPlayer',controllers.Player.getPlayer);
    app.get('/tableUpdateGet',controllers.Table.tryAgain);
    app.post('/decide',controllers.Player.test);
    app.post('/helperTable',controllers.Table.helperN);
    app.post('/tableRecreate',controllers.Table.tableRecreate);
};

module.exports = router;