const express = require('express')
const router = express.Router()
const Article = require('../../models/article');
const Category = require('../../models/category');
const User = require('../../models/user');
const Contact = require('../../models/contact');
const upload = require('../../middleware/multer') // 載入 multer
const { imgurFileHandler } = require('../../helpers/file-helpers') // 將 file-helper 載進來

//載入 imgur 套件
const imgur = require('imgur-node-api')

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID



router.get('/articles', async (req,res)=>{
  const articles = await Article.find().lean()
  .sort({createdAt:'desc'})
  res.render('admin/articles',{articles})
})

router.get('/articles/new', async (req,res)=>{
  const categories = await Category.find().lean()
  .sort({createdAt:'desc'})
  res.render('new',{article:new Article(),categories})
})

//Create
router.post('/articles', upload.single('image'), async (req,res)=>{
  // console.log(req.body)
  // const article = new Article({
  //     title: req.body.title,
  //     description: req.body.description,
  //     markdown: req.body.markdown
  // });
  try{
    const {title,category,description,markdown} = req.body
    const{file} = req

    console.log('file:',file)
    if (file){
      imgur.setClientID(IMGUR_CLIENT_ID)
      imgur.upload(file.path,(err, img) =>{
        Article.create({...req.body, image: file ? img.data.link: null})
      })
    }else{
      Article.create({...req.body})
    }
   
    
    res.redirect('/admin/articles')
  } catch(e){
    console.log(e)
    res.render('admin/articles',{ article })
  }
})


////Update
//到edit頁
router.get('/articles/edit/:id', async (req, res) => {
  // const _id = req.params.id
  // return Article.findOne({ _id})
  //   .lean()
  //   .then((article) => res.render('edit', { article}))
  //   .catch(error => console.log(error))
  try{
  const _id = req.params.id
  const article =  await Article.findOne({ _id}).lean()
  const categories = await Category.find().lean().sort({createdAt:'desc'})
  res.render('edit', { article,categories})
  }catch{
    console.log(e)
    res.redirect(`/articles/edit/:id`)
  }
})

//edit article
router.put('/articles/:id', upload.single('image'), async (req, res)=>{

  try{
    const _id = req.params.id
    const { title,description,markdown,category } = req.body
    const { file } = req // 把檔案取出來
    const article = await Article.findOne({ _id})
    if (file){
        // const filePath = await imgurFileHandler(file) // 把檔案傳到 file-helper 處理 
        imgur.setClientID(IMGUR_CLIENT_ID)
        imgur.upload(file.path,async (err, img) =>{
        // Article.update({...req.body, image: file ? img.data.link: article.image})
        article.title = title
        article.description = description
        article.markdown = markdown
        article.category = category
        article.image = img.data.link
        await article.save()
        })
    }else{
      article.title = title
      article.description = description
      article.markdown = markdown
      article.category = category
      await article.save()
    }
    res.redirect('/admin/articles')
  }catch(e){
    console.log(e)
    res.redirect(`/admin/articles`)
  }
  // const {title,description,markdown} = req.body   //和new一樣才能將markdown轉成html
  //   Article.create({...req.body})
  //   res.redirect('/')
})

//delete
router.delete('/articles/:id', (req, res) => {
  const _id = req.params.id
  return Article.findOne({ _id})
    .then(article => article.remove())
    .then(() => res.redirect('/admin/articles'))
    .catch(error => console.log(error))
})


////user
router.get('/users', async (req,res)=>{
  const users = await User.find().lean()
  .sort({createdAt:'asc'})
  res.render('admin/users',{users})
})

//edit user
router.put('/users/:id', upload.single('avatar'), async (req, res)=>{
  try{
  const _id = req.params.id
  const { name,avatar,introduction } = req.body
  const { file } = req // 把檔案取出來
 
  const user = await User.findOne({ _id})
  if (file){
    // const filePath = await imgurFileHandler(file) // 把檔案傳到 file-helper 處理 
    
    imgur.setClientID(IMGUR_CLIENT_ID)
      imgur.upload(file.path,async (err, img) =>{
        // Article.update({...req.body, image: file ? img.data.link: article.image})
        user.name = name
        // user.cover = filePath || user.cover
        user.avatar = img.data.link
        user.introduction = introduction
        await user.save()
      })
  }else{
    user.name = name
    // user.cover = filePath || user.cover
    user.avatar = img.data.link
    user.introduction = introduction
    await user.save()
  }
  res.redirect('/about')
  }catch(e){
    console.log(e)
    res.redirect(`/admin/users`)
  }
  // const {title,description,markdown} = req.body   //和new一樣才能將markdown轉成html
  //   Article.create({...req.body})
  //   res.redirect('/')
})


router.get('/users/login', (req, res) => {
  res.render('login')
})


router.get('/users/logout', (req, res) => {
  req.logout() //Passport.js 提供的函式，會幫你清除 session
  res.redirect('/users/login')
})


//categories
router.get('/categories', async (req,res)=>{
  const categories = await Category.find().lean()
  .sort({createdAt:'desc'})
  res.render('admin/categories',{categories})
})

router.get('/categories/new', (req,res)=>{
  res.render('newCategory')
})

//Create
router.post('/categories', async (req,res)=>{
  console.log(req.body)
  const errors = []
  try{
    const {categoryName,categoryEnName} = req.body
    const categoryExit = await Category.findOne({categoryName}).lean() //去資料庫找是否已經有資料
    const categoryEnNameExit = await Category.findOne({categoryEnName}).lean() //去資料庫找是否已經有資料
    if(categoryExit || categoryEnNameExit){ //if去資料庫已經有資料
      errors.push({message:'已經有這種類了 「(°ヘ°)'})
      return res.render('newCategory',{errors})
    }
    Category.create({...req.body})
    res.redirect('/admin/categories')
  } catch(e){
    console.log(e)
    res.render('admin/categories')
  }
})

//delete
router.delete('/categories/:id', (req, res) => {
  const _id = req.params.id
  return Category.findOne({ _id})
    .then(category => category.remove())
    .then(() => res.redirect('/admin/categories'))
    .catch(error => console.log(error))
})

////contact
router.get('/contacts', async (req,res)=>{
  const contacts = await Contact.find().lean()
  .sort({createdAt:'asc'})
  res.render('admin/contacts',{contacts})
})

////contact   //delete
router.delete('/contacts/:id', (req, res) => {
  const _id = req.params.id
  return Contact.findOne({ _id})
    .then(contact => contact.remove())
    .then(() => res.redirect('/admin/contacts'))
    .catch(error => console.log(error))
})

module.exports = router