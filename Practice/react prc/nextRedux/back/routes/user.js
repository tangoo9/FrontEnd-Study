const express = require('express')
const bcrypt = require('bcrypt')
const passport = require('passport')

const {User, Post} = require('../models');
const {isLoggedIn, isNotLoggedIn} =require('./middlewares');
const {Op} = require('sequelize')

const router = express.Router();

router.get('/', async (req,res,next) => {
    console.log(req.headers) //헤더로 쿠키전달 확인
    try{
        // 새로고침시에도 로그인 유지,
        // 항상 이 router가 호출되므로 req.user값이 있을때만 유저값을 전달, 없다면 null
        if(req.user){
            const userInfoWithoutPassword = await User.findOne({
                where:{id: req.user.id},
                attributes : {
                    exclude:['password']
                },
                include : [{
                    model:Post,
                    attributes : ['id'], //성능을 위해 id값만 가져오기
                },{
                    model:User,
                    as:'Followings',
                    attributes : ['id'],
                },{
                    model:User,
                    as:'Followers',
                    attributes : ['id'],
                }]
            })
            await User.findOne({
                where:{id:req.user.id}
            })
            res.status(200).json(userInfoWithoutPassword);
        }else{
            res.status(200).json(null);
        }
    }catch(err){
        console.error(err)
        next(err)
    }
})


//로그인
router.post('/login', isNotLoggedIn, (req,res,next)=>{
    passport.authenticate('local', (err,user,info)=>{ //POST/user/login
        //passport/local.js 에서 전달받은 매개변수 
        //서버에러 , 성공여부, 클라이언트에러  : null,false,{} => (err,user,info)
        if(err){
            console.error(err);
            return next(err);
        }
        if(info){
            return res.status(401).send(info.reason);
        }
        return req.login(user, async(loginErr)=>{ //passport 로그인
            if(loginErr){
                console.err(loginErr)
                return(loginErr);
            }

            // 사용자 정보 가져오기(게시물 ,팔로잉 등)
            const userInfoWithoutPassword = await User.findOne({
                where:{id:user.id},
                // attributes : ['email', 'password'] 처럼 db로부터 원하는 키워드의 컬럼만 가져올수 있음, exclude는 해당 컬럼 제외하기
                attributes : {
                    exclude:['password']
                },
                include : [{
                    model:Post,
                    attributes : ['id'],
                },{
                    model:User,
                    as:'Followings',
                    attributes : ['id'],
                },{
                    model:User,
                    as:'Followers',
                    attributes : ['id'],
                }]
            })
            return res.json(userInfoWithoutPassword)
        })
    })(req,res,next) //미들웨어 확장,express 기법
})

// 회원가입
router.post('/', isNotLoggedIn, async (req,res, next)=>{ //POST/user
    try{
        const exUser = await User.findOne({
            where : {
                email : req.body.email,
            }
        })
        if (exUser){
            //send는 마지막에 한번 씀.
            // 요청한번에 응답도 한번 일어나므로 여기서는 return을 붙여줘야함.
            return res.status(403).send('이미 사용중인 아이디입니다.');
        }
        // 비동기함수들은 await 붙여줌, 공식문서 보고 알아야함.
        const hashedPassword = await bcrypt.hash(req.body.password,10) //암호화하는 해시숫자 : 10~13정도 씀, 높을수록 강력하나 고사양 요구
        await User.create({
                email : req.body.email,
                nickname : req.body.nickname,
                password : hashedPassword,
            })
        // res.json();
        // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3060')
        res.status(201).send('ok')
    }catch(error){
        console.log(error)
        next(error);
    }
}) 

router.post('/logout', isLoggedIn, (req, res) => {
    req.logout(()=>{
        res.redirect('/');
    });
    // passport 0.6 변경점 logout은 위처럼, rediect랑 send를 같이 못 씀
    // req.session.destroy();
    // res.send('ok');
})

router.patch('/nickname' , isLoggedIn, async(req,res)=>{
    try{
        await User.update({
            nickname:req.body.nickname,
        },{
            where : {id : req.user.id},
        })
        res.status(200).json({nickname:req.body.nickname})
    }catch(err){
        console.error(err)
        next(err)
    }
})


//팔로워 불러오기
router.get('/followers' , isLoggedIn, async(req,res)=>{ //GET, /user/followers
    try{
        const user = await User.findOne({
            where:{id:req.user.id},
            attributes : {
                exclude:['password']
            }
        })
        if(!user){
            res.status(403).send('존재하지 않는 사용자 입니다.')
        }
        const Followers = await user.getFollowers({
            limit : parseInt(req.query.limit),
        });
        res.status(200).json(Followers)
    }catch(err){
        console.error(err)
        next(err)
    }
})

//팔로잉 불러오기
router.get('/followings' , isLoggedIn, async(req,res)=>{ //GET, /user/followings
    try{
        const user = await User.findOne({
            where:{id:req.user.id},
            attributes : {
                exclude:['password']
            }
        })
        if(!user){
            res.status(403).send('존재하지 않는 사용자 입니다.')
        }
        const Followings = await user.getFollowings({
            limit :parseInt(req.query.limit),
        });
        res.status(200).json(Followings)
    }catch(err){
        console.error(err)
        next(err)
    }
})


router.get('/:userId', async (req,res,next) => {
    // 특정사용자 데이터 가져오기
    try{
        const userInfoWithoutPassword = await User.findOne({
            where:{id: req.params.userId},
            attributes : {
                exclude:['password']
            },
            include : [{
                model:Post,
                attributes : ['id'], //성능을 위해 id값만 가져오기
            },{
                model:User,
                as:'Followings',
                attributes : ['id'],
            },{
                model:User,
                as:'Followers',
                attributes : ['id'],
            }]
        })
        await User.findOne({
            where:{id:req.user.id}
        })
        if(userInfoWithoutPassword){
            res .status(200).json(userInfoWithoutPassword);
        }else{
            res.status(404).json('존재하지 않는 사용자입니다..ㅜㅜ');
        }
    }catch(err){
        console.error(err)
        next(err)
    }
})

router.get('/:userId/posts', async (req,res,next)=>{
    try{
        const where = {UserId : req.params.userId};
        if(parseInt(req.query.lastId)){ //초기 로딩이 아닐때
            where.id = {[Op.lt] : parseInt(req.query.lastId)}
        }
        const posts = await Post.findAll({
            where,
            limit : 10, 
            order : [
                ['createdAt', 'DESC'],
                [Comment, 'createdAt', 'DESC']
            ],
            include : [{
                model:User,
                attributes:{
                    exclude:['password']
                }
            },{
                model : Image,
            },{
                model: Comment,
                include:[{
                    model:User,
                    attributes : {
                        exclude:['password']
                    }
                }]
            },{
                model : User, //좋아요 누른 사람
                as : 'Likers', //(model: post)에서 Likers라고 생성해준대로 가져와야됨
                attributes : ['id',]
            },{
                model:Post,
                as : 'Retweet',
                include : [{
                    model:User,
                    attributes:['id', 'nickname'],
                },{
                    model:Image
                }]
            },
            ]
        })
        // console.log(posts)
        res.status(200).json(posts);
    }catch(error){
        console.error(error)
        next(error)
    }
})



//팔로우, 언팔로우
router.patch('/:userId/follow' , isLoggedIn, async(req,res)=>{ //PATCH, /user/1/follow
    console.log('follow request')
    try{
        const user = await User.findOne({
            where:{id:req.params.userId}
        })
        if(!user){
            res.status(403).send('존재하지 않는 사용자 입니다.')
        }
        await user.addFollowers(req.user.id);
        res.status(200).json({UserId:parseInt(req.params.userId)})
    }catch(err){
        console.error(err)
        next(err)
    }
})
router.delete('/:userId/follow' , isLoggedIn, async(req,res)=>{ //DELETE, /user/1/follow
    console.log('unfollow request')
    try{
        const user = await User.findOne({
            where:{id:req.params.userId}
        })
        if(!user){
            res.status(403).send('존재하지 않는 사용자 입니다.')
        }
        await user.removeFollowers(req.user.id);
        res.status(200).json({UserId:parseInt(req.params.userId)})
    }catch(err){
        console.error(err)
        next(err)
    }
})

// 팔로워 차단
router.delete('/follower/:userId' , isLoggedIn, async(req,res)=>{ //DELETE, 
    try{
        const user = await User.findOne({
            where:{id:req.user.id}
        })
        if(!user){
            res.status(403).send('존재하지 않는 사용자 입니다.')
        }
        await user.removeFollowings(req.user.id);
        res.status(200).json({UserId:parseInt(req.params.userId)})
    }catch(err){
        console.error(err)
        next(err)
    }
})





module.exports = router;