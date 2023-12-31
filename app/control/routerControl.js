/*
 * @Author: Gaiwa 13012265332@163.com
 * @Date: 2023-10-08 15:05:18
 * @LastEditors: Gaiwa 13012265332@163.com
 * @LastEditTime: 2023-10-21 20:05:10
 * @FilePath: \myBlog_client\app\routerControl.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Author: Gaiwa 13012265332@163.com
 * @Date: 2023-10-08 15:05:18
 * @LastEditors: Gaiwa 13012265332@163.com
 * @LastEditTime: 2023-10-17 13:53:40
 * @FilePath: \myBlog_client\app\routerControl.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import Http from '../module/http';
import TempCompile from './templateControl'
import Router from 'sme-router'
import Edite from '../module/editor';
import Comment from '../module/comment'
import store from 'store'
import Packery from 'packery';
import QS from 'qs'
import modalMap from '../config/modal.config'
import Message from '../module/message';

const userInfoName = 'ua_info'
const ROUTE_MAP = {
  'write': {
    wrap: '.blog-main--container',
    editor: '#editor-container',
    toolbar: '#toolbar-container'
  },
  'index': {
    wrap: '.blog-head--login',
    tempName: 'user'
  },
  'write/submit': {
    wrap: '.blog-main--container',
    tempName: 'article'
  },
  'article': {
    wrap: '.blog-main--container',
    tempName: 'article'
  },
  'articles': {
    wrap: '.blog-main--container',
  },
  'columns': {
    wrap: '.blog-main--container',
    tempName: 'columns'
  },
  'toolbar': {
    wrap: '.blog-toolbar',
    tempName: 'toolbar'
  },
  'info': {
    wrap: '.blog-main--container',
    tempName: 'userInfo'
  },
  'slider': {
    wrap: '.blog-slide-wrap',
    tempName: 'slider'
  }
}

function routeHandle(routeName) {
  let type = routeName
  if (ROUTE_MAP[type]?.['wrap']) {
    router['_mount'] = document.querySelector(ROUTE_MAP[type].wrap)
  }
}

function renderHandle(routeName, data) {
  routeHandle(routeName)
  let { tempName } = ROUTE_MAP[routeName]
  if (!tempName) {
    tempName = routeName
  }
  return TempCompile.render(tempName, data)
}



// 实例化参数 模板渲染内容的容器的id名称
const router = new Router('page')
let editor, title = ''

router.use((req) => {
  let type = req.body?.routeName
  req.routeName = type
  router.render(renderHandle('toolbar', {
    list: []
  }))
})

router.route('/index', async (req, res, next) => {
  let routeName = 'index'
  let result = await Http({ type: routeName })
  // 根据token自动登录渲染对应页面
  if (result?.message === 'ok') {
    res.render(renderHandle(routeName, { isLogin: true }))
    let userInfo = store.get(userInfoName)
    if (!userInfo) {
      try {
        userInfo = await Http({ type: 'getUserInfo' })
        store.set(userInfoName, userInfo)
      } catch (err) {
        console.log(err);
      }
    }
    res.render(renderHandle('slider', userInfo.data))
  } else {
    res.render(renderHandle(routeName, { isLogin: false }))
  }
  let reqBody = { ...req.body }
  reqBody.routeName = 'articles'
  router.go('/articles', reqBody)
})

router.route('/columns', async (req, res, next) => {
  let routeName = 'columns'
  // 根据token自动登录渲染对应页面
  let token = store.get('ua_jot')
  if (token) {
    res.render(renderHandle('index', { isLogin: true }))
  } else {
    res.render(renderHandle('index', { isLogin: false }))
  }
  try {
    let result = await Http({ type: 'columns' })
    result = result.data
    result.list = result.list.map(item => {
      let len = item.aid.length
      item.size = Math.min((len + 1) * 2, 8)
      return item
    })
    res.render(renderHandle('columns', { list: result.list }))
    new Packery('.blog-columns', {})
  } catch (err) {
    console.log(err);
  }
})

router.route('/articles', async (req, res, next) => {
  let routeName = 'articles'
  // 获取文章列表并渲染
  try {
    let columnId = req.body.columnId
    let q = req.body.search
    let queryObj = { column: columnId, q }
    let result = await Http({ type: routeName, data: { query: QS.stringify(queryObj) } })
    result = result.data
    result.columnId = columnId
    result.list = result.list.map(item => {
      item.content = `${$(item.content).text().slice(0, 120)}...`
      return item
    })
    res.render(renderHandle('articles', result))
    res.render(renderHandle('toolbar', {
      list: [{
        route: 'write',
        content: '写文章',
        icon: 'write'
      }]
    }))
  } catch (err) {
    console.log(err);
  }
})

router.route('/article', async (req, res, next) => {
  let routeName = 'article'
  // 获取需要渲染的文章
  try {
    let articleId = req.body.id;
    let result = await Http({ type: 'getArticleById', data: { id: articleId } })
    result = result.data
    res.render(renderHandle(routeName, result))
    res.render(renderHandle('toolbar', {
      list: [
        {
          content: result.like_num,
          icon: 'like'
        },
        {
          content: result.comment_num,
          icon: 'comment'
        }
      ]
    }))
    // comment控制
    new Comment({
      eleListen: '.blog-comment--editor',
      eleInput: '.blog-comment--input',
      eleSubmit: '.blog-comment--submit',
      aid: articleId,
      uid: store.get('uid')
    }, async (data) => {
      if (!data) {
        return false
      }
      await Http({ type: 'postComment', data })
      router.go('/',)
      router.go('/article', { id: articleId })
    })
  } catch (err) {
    console.log(err);
  }
})

router.route('/info', async (req, res, next) => {
  let routeName = 'info'
  let data = modalMap[routeName]
  try {
    let userInfo = store.get(userInfoName)
    if (!userInfo) {
      new Message('请先登录').warning()
    }
    if (userInfo) {
      let result = await Http({ type: 'getUserInfo' })
      data.formData = data.formData.map(item => {
        let key = item.query
        item.value = result.data[key]
        return item
      })
    }
    res.render(renderHandle(routeName, data))
  } catch (err) {
    console.log(err);
  }
})

// 过滤无routeName 重定向到初始目录
router.route('/write', async (req, res, next) => {
  let routeName = 'write'
  // 能进入编辑页面说明已经登录，直接渲染
  res.render(renderHandle('index', { isLogin: true }))
  try {
    let result = await Http({ type: 'columns' })
    result = result.data.list
    let selectedIdx = result.reduce((acc, curr, idx) => {
      if (curr._id === req.body.columnId) {
        return idx
      }
      return acc
    }, 0)
    result = result.map((item, idx) => {
      item.selected = idx === selectedIdx
      return item
    })
    res.render(renderHandle(routeName, { list: result }))
  } catch (err) {
    console.log(err);
  }
  // 初始化编辑器
  editor = new Edite(ROUTE_MAP[routeName].editor)
  let oInput = document.querySelector('.blog-input--write')
  oInput.addEventListener('keyup', function (e) {
    title = $(e.target).val()
  })
})

router.route('/write/:active', async (req, res, next) => {
  let routeName = req.body.routeName
  if (editor) {
    let column = $('li[data-column].selected')?.data('column')
    let cover = editor?.cover
    let content = editor.html
    try {
      let result = await Http({ type: 'postArticle', data: { title, content, column, cover, author: store.get('uid') } })
      result = result.data
      title = ''
      router.go('/article', { id: result.id })
    } catch (err) {
      router.go('/write')
      console.log(err);
    }
  }
})

router.route('/', (req, res, next) => {

})

router.route('*', (req, res, next) => {
  if (!req.routeName || req.routeName === 'undefined') {
    router.go('/index')
  }
})


export default router