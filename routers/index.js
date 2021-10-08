const register = require('./register');
const login = require('./login');
const pubContent = require('./pubContent');
const connection = require('./mysqldb');
const url = require("url");

function getGradeName(grade) {
    switch (grade) {
        case 0:
            return '教工';
        case 1:
            return '高一';
        case 2:
            return '高二';
        case 3:
            return '高三';
        default:
            return undefined;
    }
}

function getTypeName(type) {
    switch (type) {
        case 'stu_male':
            return '男子组';
        case 'stu_female':
            return '女子组';
        case 'stu_union':
            return '集体组';
        case 'teach_1':
            return '甲组';
        case 'teach_2':
            return '乙组';
        case 'teach_3':
            return '丙组';
        case 'teach_union':
            return '集体组';
        default:
            return undefined;
    }
}

module.exports = function (app) {
    // 路由挂载
    // 首页
    app.get('/', function (req, res) {
        try {
            res.locals.user = req.session.user;
            connection.query(`SELECT * FROM contest ORDER BY contest.time DESC`, function (error, results, fields) {
                if (error) throw error;
                res.render("index", { contests: results });
            })
        } catch (e) {
            // res.render('error', { err: e });
        }
    });

    app.get('/contest/:id/rating', function (req, res) {
        try {
            res.locals.user = req.session.user;
            let id = parseInt(req.params.id);
            connection.query(`SELECT * FROM contest WHERE id = ${id}`, function (error, results, fields) {
                if (error)
                    res.render('rank', { error_code: 4003 });
                else if (results.length === 0)
                    res.render('rank', { error_code: 4001 });
                else {
                    let str = results[0].rating;
                    let arr = str.split('\n') || [];
                    if (!arr.length)
                        res.render('rank', { error_code: 4002 });
                    else {
                        let detail = [];
                        for (let i = 0; i < arr.length; ++i) {
                            if (arr[i].length < 1)
                                res.render('rank', { error_code: 4002 });
                            detail[i] = arr[i].split(' ') || [];
                            if (detail[i].length < 3)
                                res.render('rank', { error_code: 4002 });
                        }
                        let title = getGradeName(results[0].grade) + getTypeName(results[0].type) + results[0].title + '成绩表';

                        res.render('rank', { error_code: 1, title: title, detail: detail });
                    }
                }
            })
        } catch (e) {
            res.render('rank', { error_code: 4003 });
        }
    })

    app.post('/contest/:id/edit', function (req, res) {
        try {
            res.setHeader('Content-Type', 'application/json');
            if (!req.session.user)
                res.send(JSON.stringify({ error_code: 3001 }));
            else {
                let id = parseInt(req.params.id);
                connection.query(`SELECT * FROM contest WHERE id = ${id}`, function (error, results, fields) {
                    if (results.length === 0) {
                        connection.query(`INSERT INTO contest(title,grade,type,time,rating) VALUES("${req.body.title}",${parseInt(req.body.grade)},"${req.body.type}",${web_util.parseDate(req.body.time)},"${req.body.rating.replace('\r\n', '\n')}")`, function (error, results, fields) {
                            if (error)
                                res.send(JSON.stringify({ error_code: 3002, detail: error.message }));
                            else
                                res.send(JSON.stringify({ error_code: 1 }));
                        });
                    } else {
                        connection.query(`UPDATE contest SET title="${req.body.title}",grade=${req.body.grade},type="${req.body.type}",time=${web_util.parseDate(req.body.time)},rating="${req.body.rating.replace('\r\n', '\n')}" WHERE id=${id}`, function (error, results, fields) {
                            if (error)
                                res.send(JSON.stringify({ error_code: 3003, detail: error.message }));
                            else
                                res.send(JSON.stringify({ error_code: 1 }));
                        });
                    }
                });
            }
        } catch (e) {
            res.send(JSON.stringify({ error_code: 3004 }));
        }
    })

    app.use('/registerPage',register);
    app.use('/loginPage',login);
    app.use('/pubContent',pubContent);
}