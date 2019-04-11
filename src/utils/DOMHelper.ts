/**
 * this helper helps manipulating DOM
 */

import * as PJAX from 'pjax'
import * as NProgress from 'nprogress'
import { raiseError } from 'analytics'

NProgress.configure({ showSpinner: false })

/**
 * when gitako is ready, make page's header narrower
 */
function markGitakoReadyState() {
  const readyClassName = 'gitako-ready'
  document.body.classList.add(readyClassName)
}

/**
 * if should show gitako, then move body right to make space for showing gitako
 * otherwise, hide the space
 */
function setBodyIndent(shouldShowGitako: boolean) {
  const spacingClassName = 'with-gitako-spacing'
  if (shouldShowGitako) {
    document.body.classList.add(spacingClassName)
  } else {
    document.body.classList.remove(spacingClassName)
  }
}

function $<EE extends Element, E extends (element: EE) => any, O extends () => any>(
  selector: string,
  existCallback?: E,
  otherwise?: O,
): E extends never
  ? O extends never
    ? (Element | null)
    : ReturnType<O> | null
  : O extends never
  ? (ReturnType<E> | null)
  : ReturnType<O> | ReturnType<E> {
  const element = document.querySelector(selector)
  if (element) {
    return existCallback ? existCallback(element as EE) : element
  }
  return otherwise ? otherwise() : null
}

function isInCodePage() {
  const branchListSelector = '.branch-select-menu'
  return Boolean($(branchListSelector))
}

function getBranches() {
  const branchSelector = '.branch-select-menu .select-menu-list > div .select-menu-item-text'
  const branchElements = Array.from(document.querySelectorAll(branchSelector))
  return branchElements.map(element => element.innerHTML.trim())
}

function getCurrentBranch() {
  const selectedBranchButtonSelector = '.repository-content .branch-select-menu summary'
  const branchButtonElement: HTMLElement = $(selectedBranchButtonSelector)
  if (branchButtonElement) {
    const branchNameSpanElement = branchButtonElement.querySelector('span')
    if (branchNameSpanElement) {
      const partialBranchNameFromInnerText = branchNameSpanElement.innerText
      if (!partialBranchNameFromInnerText.includes('…')) return partialBranchNameFromInnerText
    }
    const defaultTitle = 'Switch branches or tags'
    const title = branchButtonElement.title.trim()
    if (title !== defaultTitle) return title
  }

  const findFileButtonSelector =
    '#js-repo-pjax-container .repository-content .file-navigation a[data-hotkey="t"]'
  const urlFromFindFileButton: string | undefined = $(
    findFileButtonSelector,
    element => (element as HTMLAnchorElement).href,
  )
  if (urlFromFindFileButton) {
    const commitPathRegex = /^(.*?)\/(.*?)\/find\/(.*?)$/
    const result = urlFromFindFileButton.match(commitPathRegex)
    if (result) {
      const [_, userName, repoName, branchName] = result
      return branchName
    }
  }

  raiseError(new Error('cannot get current branch'))
}

/**
 * add the logo element into DOM
 *
 */
function insertLogoMountPoint() {
  const logoSelector = '.gitako .gitako-logo'
  return $(logoSelector) || createLogoMountPoint()
}

function createLogoMountPoint() {
  const logoMountElement = document.createElement('div')
  logoMountElement.setAttribute('class', 'gitako-logo-mount-point')
  document.body.appendChild(logoMountElement)
  return logoMountElement
}

/**
 * content above the file navigation bar is same for all pages of the repo
 * use this function to scroll down a bit to hide them
 */
function scrollToRepoContent() {
  const repositoryContentSelector = '.repository-content'
  // do NOT use behavior: smooth here as it will scroll horizontally
  $(repositoryContentSelector, repositoryContentElement =>
    repositoryContentElement.scrollIntoView(),
  )
}

/**
 * scroll to index-th element in the list
 */
function scrollToNodeElement(index: number) {
  const nodeElementSelector = '.node-item'
  const nodeElements = document.querySelectorAll(nodeElementSelector)
  const targetElement = nodeElements[index]
  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  } else {
    raiseError(new Error('cannot find DOM node to scroll to'))
  }
}

const pjax = new PJAX({
  elements: '.pjax-link',
  selectors: ['.repository-content', 'title'],
  scrollTo: false,
  analytics: false,
  cacheBust: false,
  forceCache: true, // TODO: merge namespace, add forceCache
})

function loadWithPJAX(URL: string) {
  NProgress.start()
  pjax.loadUrl(URL, { scrollTo: 0 })
}

/**
 * there are few types of pages on GitHub, mainly
 * 1. raw text: code
 * 2. rendered content: like Markdown
 * 3. preview: like image
 */
const PAGE_TYPES = {
  RAW_TEXT: 'raw_text',
  RENDERED: 'rendered',
  // PREVIEW: 'preview',
  OTHERS: 'others',
}

/**
 * this function tries to tell which type current page is of
 *
 * note: not determining through file extension here
 * because there might be files using wrong extension name
 *
 * TODO: distinguish type 'preview'
 */
function getCurrentPageType() {
  const blobWrapperSelector = '.repository-content .file .blob-wrapper table'
  const readmeSelector = '.repository-content .readme'
  return (
    $(blobWrapperSelector, () => PAGE_TYPES.RAW_TEXT) ||
    $(readmeSelector, () => PAGE_TYPES.RENDERED) ||
    PAGE_TYPES.OTHERS
  )
}

export const REPO_TYPE_PRIVATE = 'private'
export const REPO_TYPE_PUBLIC = 'public'
function getRepoPageType() {
  const headerSelector = `#js-repo-pjax-container .pagehead.repohead h1`
  return $(headerSelector, header => {
    const repoPageTypes = [REPO_TYPE_PRIVATE, REPO_TYPE_PUBLIC]
    for (const repoPageType of repoPageTypes) {
      if (header.classList.contains(repoPageType)) {
        return repoPageType
      }
    }
    raiseError(new Error('cannot get repo page type'))
  })
}

/**
 * add copy file content buttons to button groups
 * click these buttons will copy file content to clipboard
 */
function attachCopyFileBtn() {
  /**
   * get text content of raw text content
   */
  function getCodeElement() {
    if (getCurrentPageType() === PAGE_TYPES.RAW_TEXT) {
      const codeContentSelector = '.repository-content .file .data table'
      const codeContentElement = $(codeContentSelector)
      if (!codeContentElement) {
        raiseError(new Error('cannot find code content element'))
      }
      return codeContentElement
    }
  }

  /**
   * change inner text of copy file button to give feedback
   * @param {element} copyFileBtn
   * @param {string} text
   */
  function setTempCopyFileBtnText(copyFileBtn: HTMLButtonElement, text: string) {
    copyFileBtn.innerText = text
    window.setTimeout(() => (copyFileBtn.innerText = 'Copy file'), 1000)
  }

  if (getCurrentPageType() === PAGE_TYPES.RAW_TEXT) {
    const btnGroupSelector = [
      // the button group next to navigation bar
      '.repository-content .file-navigation.js-zeroclipboard-container .BtnGroup',
      // the button group in file content header
      '.repository-content .file .file-header .file-actions .BtnGroup',
    ].join(', ')
    const btnGroups = document.querySelectorAll(btnGroupSelector)

    btnGroups.forEach(btnGroup => {
      const copyFileBtn = document.createElement('button')
      copyFileBtn.classList.add('btn', 'btn-sm', 'BtnGroup-item', 'copy-file-btn')
      copyFileBtn.innerText = 'Copy file'
      copyFileBtn.addEventListener('click', () => {
        const codeElement = getCodeElement()
        if (codeElement) {
          if (copyElementContent(codeElement)) {
            setTempCopyFileBtnText(copyFileBtn, 'Success!')
          } else {
            setTempCopyFileBtnText(copyFileBtn, 'Copy failed!')
          }
        }
      })
      btnGroup.insertBefore(copyFileBtn, btnGroup.lastChild)
    })
  }
}

/**
 * copy content of a DOM element to clipboard
 * @param {element} element
 * @returns {boolean} whether copy is successful
 */
function copyElementContent(element: Element) {
  let selection = window.getSelection()
  if (selection) selection.removeAllRanges()
  const range = document.createRange()
  range.selectNode(element)
  selection = window.getSelection()
  if (selection) selection.addRange(range)
  const isCopySuccessful = document.execCommand('copy')
  selection = window.getSelection()
  if (selection) selection.removeAllRanges()
  return isCopySuccessful
}

/**
 * create a copy file content button `clippy`
 * once mouse enters a code snippet of markdown, move clippy into it
 * user can copy the snippet's content by click it
 *
 * TODO: 'reactify' it
 */
function createClippy() {
  function setTempClippyIconFeedback(clippy: Element, type: 'success' | 'fail') {
    const tempIconClassName = type === 'success' ? 'success' : 'fail'
    clippy.classList.add(tempIconClassName)
    window.setTimeout(() => {
      clippy.classList.remove(tempIconClassName)
    }, 1000)
  }

  /**
   * <div class="clippy-wrapper">
   *    <button class="clippy">
   *      <i class="octicon octicon-clippy" />
   *    </button>
   *  </div>
   */
  const clippyWrapper = document.createElement('div')
  clippyWrapper.classList.add('clippy-wrapper')
  const clippy = document.createElement('button')
  clippy.classList.add('clippy')
  const clippyIcon = document.createElement('i')
  clippyIcon.classList.add('icon')

  clippyWrapper.appendChild(clippy)
  clippy.appendChild(clippyIcon)

  // set clipboard with current code snippet element's content
  clippy.addEventListener('click', function onClippyClick() {
    if (copyElementContent(currentCodeSnippetElement)) {
      setTempClippyIconFeedback(clippy, 'success')
    } else {
      setTempClippyIconFeedback(clippy, 'fail')
    }
  })

  return clippyWrapper
}

const clippy = createClippy()

let currentCodeSnippetElement: Element
function attachCopySnippet() {
  const readmeSelector = '.repository-content #readme'
  return $(readmeSelector, () => {
    const readmeArticleSelector = '.repository-content #readme article'
    $(
      readmeArticleSelector,
      readmeElement =>
        readmeElement.addEventListener('mouseover', e => {
          // only move clippy when mouse is over a new snippet(<pre>)
          const target = e.target as Element
          if (target.nodeName === 'PRE') {
            if (currentCodeSnippetElement !== target) {
              currentCodeSnippetElement = target
              /**
               *  <article>
               *    <pre></pre>     <!-- case A -->
               *    <div class="highlight">
               *      <pre></pre>   <!-- case B -->
               *    </div>
               *  </article>
               */
              if (target.parentNode) target.parentNode.insertBefore(clippy, target)
            }
          }
        }),
      () => {
        const plainReadmeSelector = '.repository-content #readme .plain'
        $(plainReadmeSelector, undefined, () =>
          raiseError(
            new Error('cannot find mount point for copy snippet button while readme exists'),
          ),
        )
      },
    )
  })
}

/**
 * focus to side bar, user will be able to manipulate it with keyboard
 */
function focusFileExplorer() {
  const sideBarContentSelector = '.gitako-side-bar .file-explorer'
  $(sideBarContentSelector, sideBarElement => {
    if (sideBarElement instanceof HTMLElement) sideBarElement.focus()
  })
}

function focusSearchInput() {
  const searchInputSelector = '.search-input'
  $(searchInputSelector, searchInputElement => {
    if (
      document.activeElement !== searchInputElement &&
      searchInputElement instanceof HTMLElement
    ) {
      searchInputElement.focus()
    }
  })
}

/**
 * a combination of few above functions
 */
function decorateGitHubPageContent({
  copyFileButton,
  copySnippetButton,
}: {
  copyFileButton: boolean
  copySnippetButton: boolean
}) {
  if (copyFileButton) attachCopyFileBtn()
  if (copySnippetButton) attachCopySnippet()
}

function mountTopProgressBar() {
  NProgress.start()
}

function unmountTopProgressBar() {
  NProgress.done()
}

export default {
  loadWithPJAX,
  attachCopyFileBtn,
  attachCopySnippet,
  decorateGitHubPageContent,
  focusSearchInput,
  focusFileExplorer,
  getCurrentPageType,
  getRepoPageType,
  insertLogoMountPoint,
  markGitakoReadyState,
  setBodyIndent,
  scrollToNodeElement,
  scrollToRepoContent,
  mountTopProgressBar,
  unmountTopProgressBar,
  isInCodePage,
  getBranches,
  getCurrentBranch,
}
