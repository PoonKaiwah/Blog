/*
 * @Author: Gaiwa 13012265332@163.com
 * @Date: 2023-10-06 15:58:20
 * @LastEditors: Gaiwa 13012265332@163.com
 * @LastEditTime: 2023-10-21 18:15:18
 * @FilePath: \express\myBlog\modules\actionControl.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 管理页面所有发生的行为
 * 调用功能模块
 * 
 * modal行为
 *  modal唤起渲染
 *  modal上按钮触发
 * 
 * form行为
 *  blur 清除错误提示
 *  confirm 提交 校验
 */

import Modal from './modalControl'
import router from './routerControl'

export default class Action {
  constructor(params) {
    this.init()
    this.modalAgency()
    this.formAgency()
    this.routerAgency()
    this.columnsAgency()
    this.searchAgency()
  }
  init() {
    router.go('/index')
  }
  // modal
  modalAgency() {
    // 监听所有[data-modal] 元素的click事件 渲染唤起对应的modal
    $(document).on('click', ['data-modal'], (e) => {
      let $target = $(e.target)
      let modalType = $target.data('modal')
      // 防止模板渲染 data-modal属性值缺失
      if (!modalType) {
        return false
      }
      if (modalType === 'info') {
        this.modal = new Modal({ modalWrap: $('.blog-main--container'), modalType })
      }
      if (modalType !== 'info') {
        this.modal = new Modal({ modalType })
        this.modal.render()
      }
    })
    // 监听modal上的button
    // 由于插件之间冲突，无法监听表单的submit事件，因此写在button的点击事件中
    $(document).on('click', 'button[data-modal-btn]', (e) => {
      e.preventDefault()
      let $target = $(e.target)
      let btnType = $target.data('modal-btn')
      if (this.modal) {
        this.modal[btnType]()
      }
    })
  }
  // 搜索
  searchAgency() {
    function routeSearch(target) {
      let val = $(target).val()
      if (val) {
        let routeName = $(target).data('input')
        $(target).val('')
        router.go('/')
        router.go(`/${routeName}`, {
          routeName, search: val
        })
      }
      $(target).val('').trigger('blur')
    }
    function getSearchValue(e) {
      if (e.keyCode === 13) {
        routeSearch(e.target)
      }
    }
    $(document).on('focus', '[data-input]', (e) => {
      let $inputTarget = $(e.target)
      $inputTarget.on('keyup', getSearchValue)
    })

    $(document).on('blur', '[data-input]', (e) => {
      let $inputTarget = $(e.target)
      $inputTarget.off('keyup', getSearchValue)
    })

    // 搜索行为 点击事件
    $(document).on('click', '[data-submit]', (e) => {
      let $target = $(e.target)
      let submitType = $target.data('submit')
      let $input = $(`[data-input=${submitType}]`)
      routeSearch($input)
    })

  }
  // form
  formAgency() {
    // form input 开始输入时 清除错误提示
    $(document).on('change', 'input[data-modal-input]', (e) => {
      let $target = $(e.target)
      let inputEle = $target.parent().parent().children()
      $.each(inputEle, (idx, ele) => {
        ele.dataset['msg'] = ''
      })
    })
  }
  // router
  routerAgency() {
    // 监听其他点击事件
    $(document).on('click', 'a[data-router]', function (e) {
      let $target = $(this)
      let routeName = $target.data('router')
      let id = $target.data('article-id')
      let columnId = $target.data('column-id')
      router.go(`/${routeName}`, { id, columnId })
    })
  }

  columnsAgency() {
    $(document).on('click', 'li[data-column]', function (e) {
      $(this).addClass('selected').siblings('li').removeClass('selected')
    })
  }
}
