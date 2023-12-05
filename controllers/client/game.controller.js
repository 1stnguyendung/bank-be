const gameController = {
    list: async(req, res, next) => {
        try {
            res.json({
                game: [
                    { id: 1, name: 'Tài xỉu', rate: Math.floor(Math.random() * 99999999) },
                    { id: 2, name: 'Chẵn lẻ', rate: Math.floor(Math.random() * 99999999) },
                ],
            })
        } catch (err) {
            next(err);
        }
    }
}

module.exports = gameController;