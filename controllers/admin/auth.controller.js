const authService = require('../../services/auth.service');

const authController = {
    register: async (req, res, next) => {
        try {
            let { name, username, password } = req.body;
            let token = req.headers.token;

            if (!name || !username || !password) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            if (!token) {
                return res.json({
                    success: false,
                    message: 'Thiếu dữ liệu!'
                })
            }

            if (process.env.TOKEN_SETUP != token) {
                return res.json({
                    success: false,
                    message: 'TOKEN_SETUP không hợp lệ!'
                })
            }

            return res.json(await authService.register(name, username, password, req.ip, 1));

        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    login: async (req, res, next) => {
        try {
            let { username, password } = req.body;

            if (!username || !password) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            let loginData = await authService.login(username, password, req.ip);

            if (loginData.status) {
                res.cookie('Authorization', loginData.token, {
                    httpOnly: true,
                    maxAge: 168 * 60 * 60 * 1000 // 7 days
                });
            }

            return res.json(loginData);

        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    logout: async (req, res) => res.clearCookie('Authorization').redirect(`..${process.env.adminPath}`)
}

module.exports = authController;