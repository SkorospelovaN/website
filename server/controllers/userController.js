const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {User, Cart} = require('../models/models')

const generateJwt = (id, email, role, fio, phone) => {
    return jwt.sign(
        {id, email, role, fio, phone}, 
        process.env.SECRET_KEY, 
        {expiresIn: '24h'})
}

class UserController {
    async registration(req,res, next){
        const {email, password, role, fio, phone} = req.body
        if(!email || !password) {
            return next(ApiError.badRequest('Некорректный e-mail или пароль'))
        } 
        const candidate = await User.findOne({where: {email}})
        if (candidate) {
            return next(ApiError.badRequest('Пользователь с таким e-mail уже существует'))
        }
        const hashPassword = await bcrypt.hash(password, 5)
        const user = await User.create({email, password: hashPassword, role, fio, phone})
        const cart = await Cart.create({userId: user.id})
        const token = generateJwt(user.id, user.email, user.role, user.fio, user.phone)
        return res.json({token})
    }

    async login(req,res, next){
        const {email, password} = req.body
        const user = await User.findOne({where: {email}})
        if(!user) {
            return next(ApiError.internal('Пользователь не найден'))
        }
        let comparePassword = bcrypt.compareSync(password, user.password)
        if(!comparePassword) {
            return next(ApiError.internal('Указан неверный пароль'))
        }
        const token = generateJwt(user.id, user.email, user.role, user.fio, user.phone)
        return res.json({token})
    }

    async loginAdmin(req,res, next){
        const {email, password, role} = req.body
        const user = await User.findOne({where: {email}})
        if(!user) {
            return next(ApiError.internal('Пользователь не найден'))
        }
        let comparePassword = bcrypt.compareSync(password, user.password)
        let checkRole = req.user.role("ADMIN")
        if(!comparePassword && !checkRole) {
            return next(ApiError.internal('Указан неверный пароль'))
        }
        const token = generateJwt(user.id, user.email, user.role, user.fio, user.phone)
        return res.json({token})
    }

    async check(req,res, next){
        const token = generateJwt(req.user.id, req.user.email, req.user.role, req.user.fio, req.user.phone)
        return res.json({token})
    }

    async getAll(req,res){
        const users = await User.findAll()
        return res.json(users)
    }

    async getOne(req, res) {
        const {id} = req.params
        const user = await User.findOne(
            {
                where: {id: 9},
            },
        )
        return res.json(user)
    }
}

module.exports = new UserController()